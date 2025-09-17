
# WEBDBMS — Backend + React Frontend

## Backend (FastAPI)
Env:
- USE_MONGO=true to use Mongo (else JSON file database.json)
- MONGO_URI, MONGO_DBNAME
- JWT_SECRET, JWT_EXP_MINUTES

Run:
```
uvicorn WEBDBMSresearch.fastapi_app:app --reload --port 8001
```

Seed admin: username `admin`, password `admin12345`.

## Frontend (Vite + React + Tailwind)
Create `.env` with:
```
VITE_API_URL=http://localhost:8001
```
Install & run:
```
cd frontend
npm install
npm run dev
```

## Features
- JWT auth with refresh
- Role-based routes (admin/technician can write)
- User admin: create users, list users
- Inventory views with animated/hover UI
