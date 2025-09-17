from fastapi import HTTPException, Header, Depends
from typing import Dict, Any, List
from datetime import datetime, timedelta
import os, json, jwt
from uuid import uuid4

# --- Storage managers ---
class JSONStorageManager:
    def __init__(self, file_path="database.json"):
        self.file_path = file_path
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _load(self):
        with open(self.file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, data):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def list_items(self, lab: str) -> Dict[str, Any]:
        data = self._load()
        return data.get(lab, {})

    def get_item(self, lab: str, item_id: str) -> Any:
        return self._load().get(lab, {}).get(item_id)

    def create_item(self, lab: str, item: Dict[str, Any]) -> str:
        data = self._load()
        lab_data = data.setdefault(lab, {})
        new_id = str(uuid4())
        lab_data[new_id] = item
        self._save(data)
        return new_id

    def update_item(self, lab: str, item_id: str, item: Dict[str, Any]) -> Dict[str, Any]:
        data = self._load()
        if lab not in data or item_id not in data[lab]:
            raise KeyError("Not found")
        data[lab][item_id] = item
        self._save(data)
        return item

    def delete_item(self, lab: str, item_id: str) -> None:
        data = self._load()
        if lab in data and item_id in data[lab]:
            del data[lab][item_id]
            self._save(data)

    def list_users(self) -> Dict[str, Any]:
        data = self._load()
        return data.setdefault("users", {})

    def create_user(self, doc: Dict[str, Any]) -> str:
        data = self._load()
        users = data.setdefault("users", {})
        uid = str(uuid4())
        users[uid] = doc
        self._save(data)
        return uid

    def update_user(self, uid: str, doc: Dict[str, Any]) -> None:
        data = self._load()
        users = data.setdefault("users", {})
        users[uid] = doc
        self._save(data)

try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None

class MongoStorageManager:
    def __init__(self, uri="mongodb://localhost:27017", dbname="webdbms"):
        if MongoClient is None:
            raise RuntimeError("pymongo not installed")
        self.client = MongoClient(uri)
        self.db = self.client[dbname]

    def list_items(self, lab: str):
        return {str(d["_id"]): {k:v for k,v in d.items() if k != "_id"} for d in self.db[lab].find()}

    def get_item(self, lab: str, item_id: str):
        doc = self.db[lab].find_one({"_id": item_id})
        if not doc: return None
        doc.pop("_id", None)
        return doc

    def create_item(self, lab: str, item: Dict[str, Any]) -> str:
        _id = str(uuid4())
        item = dict(item)
        item["_id"] = _id
        self.db[lab].insert_one(item)
        return _id

    def update_item(self, lab: str, item_id: str, item: Dict[str, Any]):
        self.db[lab].update_one({"_id": item_id}, {"$set": item}, upsert=False)
        return item

    def delete_item(self, lab: str, item_id: str):
        self.db[lab].delete_one({"_id": item_id})

    def list_users(self):
        return {str(d["_id"]): {k:v for k,v in d.items() if k != "_id"} for d in self.db["users"].find()}

    def create_user(self, doc: Dict[str, Any]) -> str:
        _id = str(uuid4())
        self.db["users"].insert_one({**doc, "_id": _id})
        return _id

    def update_user(self, uid: str, doc: Dict[str, Any]) -> None:
        self.db["users"].update_one({"_id": uid}, {"$set": doc})

# Initialize storage
USE_MONGO = os.getenv("USE_MONGO", "false").lower() == "true"
if USE_MONGO:
    storage = MongoStorageManager(os.getenv("MONGO_URI", "mongodb://localhost:27017"), os.getenv("MONGO_DBNAME", "webdbms"))
else:
    storage = JSONStorageManager(os.getenv("JSON_DB", "database.json"))

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_EXP_MINUTES = int(os.getenv("JWT_EXP_MINUTES", "30"))

def create_token_for_user(user_id: str):
    payload = {"sub": user_id, "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    uid = data.get("sub")
    users = storage.list_users()
    u = users.get(uid)
    if not u: raise HTTPException(status_code=401, detail="User not found")
    u["id"] = uid
    return u

def require_role(required: List[str]):
    def dep(u = Depends(get_current_user)):
        if u.get("role") not in required:
            raise HTTPException(status_code=403, detail="Forbidden")
        return u
    return dep