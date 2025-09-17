# Copilot Instructions for WEBDBMS

## Project Overview
- **Backend:** FastAPI app (`WEBDBMSresearch/fastapi_app.py`) with optional MongoDB or JSON file storage (`database.json`).
- **Frontend:** React (Vite, Tailwind) in `WEBDBMSresearch/frontend/`.
- **Auth:** JWT-based, with role-based access (admin, technician, user). Admin seeding via `seed_admin.py`.
- **Reports Forum:** Users can submit/view reports (e.g., broken/missing items) via a forum-like interface. Reports are stored in the backend and accessible to all roles.
- **Borrow API:** Grouped borrow requests (multiple items per request) with status workflow (pending, approved, returned, cancelled).
- **Theme:** Gold and dark blue color scheme for all main UI components.

## Key Workflows
- **Backend dev:**
  - Run: `uvicorn WEBDBMSresearch.fastapi_app:app --reload --port 8001`
  - Env vars: `USE_MONGO`, `MONGO_URI`, `MONGO_DBNAME`, `JWT_SECRET`, `JWT_EXP_MINUTES`
  - Data: Uses `database.json` by default, MongoDB if enabled (borrow API only supports JSON)
- **Frontend dev:**
  - `cd WEBDBMSresearch/frontend && npm install && npm run dev`
  - API URL set in `.env` as `VITE_API_URL`

## Architecture & Patterns
- **API:**
  - Main routes in `main/routes.py` (currently empty, see `fastapi_app.py` for actual endpoints)
  - Role blueprints: `roles/{admin,technician,user}/blueprint.py` (not currently active)
  - Decorators in `core/decorators.py` for auth/role checks
  - QR code logic in `api/qr.py`
  - **Borrow API:** `api/borrow.py` provides `/api/borrow` endpoints for grouped borrow requests with item details (id, name, quantity), approval, return, and cancellation. Only JSON storage supported for borrow requests.
  - **Reports API:** `api/reports.py` provides `/api/reports` endpoints for submitting and listing reports.
- **Frontend:**
  - Main entry: `frontend/src/main.jsx`, root component: `App.jsx`
  - Components: `frontend/src/components/`
  - Inventory table: `InventoryTable.jsx` (gold/dark blue theme, grouped borrow cart, potion emoji add-to-cart)
  - Reports forum: `ReportsForum.jsx` (list, submit, and view reports)
  - API client: `frontend/src/api/client.js`
- **Templates:** Jinja2 HTML in `templates/`, organized by role

## Conventions
- **Role-based routing:** Each role has its own blueprint and template folder (not currently active)
- **JWT auth:** All protected routes require JWT; refresh supported
- **Admin user:** Default admin seeded with `seed_admin.py` (username: `admin`, password: `admin12345`)
- **Frontend API calls:** Use `client.js` for all backend requests
- **Borrow workflow:**
  - Users add items to a cart (potion emoji button), select quantities, and submit a grouped borrow request.
  - Admins/techs can approve, return, or cancel requests from the inventory table.
  - Borrow requests update item quantities in `database.json`.
  - Only JSON storage is supported for borrow requests (MongoDB not yet implemented).
- **Theme:** All main UI uses a gold and dark blue color palette for a modern, elegant look.

## Examples
- To add a new borrow endpoint: implement in `api/borrow.py` and register with FastAPI in `fastapi_app.py`.
- To add a new React component: place in `frontend/src/components/`, import in `App.jsx`
- To extend the borrow workflow:
  - Backend: Add new endpoints to `api/borrow.py` (e.g., for comments, status updates).
  - Frontend: Update `InventoryTable.jsx` for new features (cart, status, etc.).

## Testing & Debugging
- No explicit test suite found; manual testing via frontend and API
- Debug backend with FastAPI/uvicorn logs; frontend with browser devtools
- Borrow workflow: Test cart, submission, approval, return, and cancellation via `/api/borrow` endpoints and UI.

## External Dependencies
- FastAPI, Uvicorn, PyJWT, (optional) pymongo
- React, Vite, Tailwind CSS (frontend)

---
**Edit this file to update agent instructions as the project evolves.**
