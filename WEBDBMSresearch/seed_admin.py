
"""
Run once to create a default admin in the JSON DB (used by FastAPI).
Usage:
  python seed_admin.py
"""
import os, json
from pathlib import Path
try:
    from werkzeug.security import generate_password_hash
except Exception:
    # fallback simple hash (not ideal, but avoids import error)
    import hashlib
    def generate_password_hash(pw: str):
        return hashlib.sha256(pw.encode()).hexdigest()

HERE = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("JSON_DB", HERE / "database.json"))

def main():
    if not DB_PATH.exists():
        # initialize empty DB
        DB_PATH.write_text("{}", encoding="utf-8")
    data = json.loads(DB_PATH.read_text(encoding="utf-8") or "{}")
    users = data.get("users", {})
    # check for any admin
    any_admin = False
    for u in users.values():
        if u.get("role") == "admin":
            any_admin = True
            break
    if any_admin:
        print("✅ Admin already exists. No action taken.")
        return
    # create default admin
    admin_doc = {
        "username": "admin",
        "password_hash": generate_password_hash("admin12345"),
        "role": "admin",
        "lab": None,
        "preferences": {
            "theme": {"name": "chem", "primary": "#4FD1C5", "accent": "#60A5FA"},
            "layout": ["quick_actions","inventory","borrowed","announcements"],
            "buttons": {"add_item":"Log New Chemical","scan":"Scan QR","reports":"Reports"}
        }
    }
    # generate a fake id
    from uuid import uuid4
    uid = "seed-admin-" + str(uuid4())
    users[uid] = admin_doc
    data["users"] = users
    DB_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("🎉 Default admin created.")
    print("   username: admin")
    print("   password: admin12345")
    print(f"   db file : {DB_PATH}")

if __name__ == "__main__":
    main()
