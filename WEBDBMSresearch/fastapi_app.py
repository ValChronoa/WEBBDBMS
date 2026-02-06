from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from werkzeug.security import check_password_hash, generate_password_hash
from uuid import uuid4
from datetime import datetime, timedelta
import jwt
from .api import reports, borrow
from .core.dependencies import storage, get_current_user, require_role, create_token_for_user, JWT_SECRET

# --- App and security ---
app = FastAPI(title="WEBDBMS API")

# Include routers
app.include_router(reports.router)
app.include_router(borrow.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItemModel(BaseModel):
    data: Dict[str, Any]

class Credentials(BaseModel):
    username: str
    password: str

class NewUser(BaseModel):
    username: str
    password: str = Field(min_length=8)
    role: str = "user"
    lab: Optional[str] = None

class PasswordChange(BaseModel):
    new_password: str = Field(min_length=8)


class UserPreferences(BaseModel):
    theme: Optional[Dict[str, Any]] = None  # e.g., {"name":"chem", "primary":"#3fb", ...}
    layout: Optional[List[str]] = None      # e.g., ["quick_actions","inventory","borrowed","announcements"]
    buttons: Optional[Dict[str, Any]] = None  # label/icon customization

# --- Auth ---
@app.post("/api/auth/login")
def login(body: Credentials):
    users = storage.list_users()
    found = None
    for uid, u in users.items():
        if u.get("username") == body.username:
            found = (uid, u); break
    if not found: raise HTTPException(status_code=401, detail="Invalid credentials")
    uid, u = found
    if not check_password_hash(u.get("password_hash",""), body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_token_for_user(uid)
    refresh = jwt.encode({"sub": uid, "jti": str(uuid4()), "exp": datetime.utcnow() + timedelta(days=7)}, JWT_SECRET, algorithm="HS256")
    return {"access_token": access, "refresh_token": refresh, "user": {"id": uid, "username": u.get("username"), "role": u.get("role"), "lab": u.get("lab")}}

@app.post("/api/auth/refresh")
def refresh(payload: dict):
    token = payload.get("refresh_token")
    if not token: raise HTTPException(status_code=400, detail="Missing refresh_token")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    uid = data.get("sub")
    access = create_token_for_user(uid)
    return {"access_token": access}

@app.get("/api/auth/me")
def me(u = Depends(get_current_user)):
    return {"id": u["id"], "username": u["username"], "role": u.get("role"), "lab": u.get("lab")}

# --- Items CRUD (per lab) ---
@app.get("/api/{lab}/items")
def list_items(lab: str, u = Depends(get_current_user)):
    return storage.list_items(lab)

@app.get("/api/{lab}/items/{item_id}")
def get_item(lab: str, item_id: str, u = Depends(get_current_user)):
    item = storage.get_item(lab, item_id)
    if not item: raise HTTPException(status_code=404, detail="Not found")
    return item

@app.post("/api/{lab}/items", dependencies=[Depends(require_role(["admin","technician"]))])
def create_item(lab: str, item: ItemModel):
    new_id = storage.create_item(lab, item.data)
    return {"id": new_id, "data": item.data}

@app.put("/api/{lab}/items/{item_id}", dependencies=[Depends(require_role(["admin","technician"]))])
def update_item(lab: str, item_id: str, item: ItemModel):
    try:
        updated = storage.update_item(lab, item_id, item.data)
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": item_id, "data": updated}

@app.delete("/api/{lab}/items/{item_id}", dependencies=[Depends(require_role(["admin","technician"]))])
def delete_item(lab: str, item_id: str):
    storage.delete_item(lab, item_id)
    return {"ok": True}

# --- Admin Users ---
@app.get("/api/users", dependencies=[Depends(require_role(["admin","technician"]))])
def admin_list_users():
    users = storage.list_users()
    return [{"id": uid, "username": u.get("username"), "role": u.get("role"), "lab": u.get("lab")} for uid,u in users.items()]

@app.post("/api/users", dependencies=[Depends(require_role(["admin","technician"]))])
def admin_create_user(u: NewUser):
    doc = {"username": u.username, "password_hash": generate_password_hash(u.password), "role": u.role, "lab": u.lab}
    uid = storage.create_user(doc)
    return {"id": uid, "username": u.username, "role": u.role, "lab": u.lab}


# --- Per-user Preferences ---
@app.get("/api/users/{uid}/preferences")
def get_preferences(uid: str, user = Depends(get_current_user)):
    if user.get("role") != "admin" and user.get("id") != uid:
        raise HTTPException(status_code=403, detail="Forbidden")
    users = storage.list_users()
    u = users.get(uid)
    if not u: raise HTTPException(status_code=404, detail="User not found")
    return u.get("preferences", {})

@app.put("/api/users/{uid}/preferences")
def put_preferences(uid: str, prefs: UserPreferences, user = Depends(get_current_user)):
    if user.get("role") != "admin" and user.get("id") != uid:
        raise HTTPException(status_code=403, detail="Forbidden")
    users = storage.list_users()
    u = users.get(uid)
    if not u: raise HTTPException(status_code=404, detail="User not found")
    pref_dict = u.get("preferences", {})
    incoming = {k:v for k,v in prefs.dict(exclude_none=True).items()}
    pref_dict.update(incoming)
    u["preferences"] = pref_dict
    storage.update_user(uid, u)
    return {"ok": True, "preferences": pref_dict}

@app.put("/api/users/{uid}/password")
def change_password(uid: str, body: PasswordChange, user = Depends(get_current_user)):
    if user.get("role") != "admin" and user.get("id") != uid:
        raise HTTPException(status_code=403, detail="Forbidden")
    users = storage.list_users()
    data = users.get(uid)
    if not data: raise HTTPException(status_code=404, detail="User not found")
    data["password_hash"] = generate_password_hash(body.new_password)
    storage.update_user(uid, data)
    return {"ok": True}

# Pre-create an admin user if none exist
@app.on_event("startup")
def startup_event():
    users = storage.list_users()
    if not any(u.get("role") == "admin" for u in users.values()):
        # Create a default admin user
        storage.create_user({
            "username": "admin",
            "password_hash": generate_password_hash("admin12345"),
            "role": "admin",
            "lab": None
        })
