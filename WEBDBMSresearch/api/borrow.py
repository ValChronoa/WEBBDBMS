from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import uuid4
from datetime import datetime
from ..core.dependencies import storage, require_role, get_current_user
from .qr import generate_qr_code

router = APIRouter(prefix="/api/borrow", tags=["borrow"])

class BorrowItem(BaseModel):
    id: str
    name: str  # Add name field
    quantity: int

class BorrowRequest(BaseModel):
    items: List[BorrowItem]
    user_id: Optional[str] = None
    username: Optional[str] = None
    status: str = "pending"
    created_at: Optional[str] = None

@router.get("/")
def list_borrow_requests(user = Depends(require_role(["admin", "technician", "user"]))):
    data = storage._load()
    borrow_requests = data.get("borrow_requests", {})
    # Filter requests - admins/techs see all, users see only their own
    if user["role"] == "user":
        borrow_requests = {k: v for k, v in borrow_requests.items() if v["user_id"] == user["id"]}
    return list(borrow_requests.values())

@router.post("/")
def submit_borrow_request(req: BorrowRequest, user = Depends(require_role(["user"]))):
    data = storage._load()
    borrow_requests = data.setdefault("borrow_requests", {})
    
    # Verify items exist and have sufficient quantity
    for item_req in req.items:
        lab_items = {}
        # Check all labs since we don't know which lab the item is in
        for lab in data.keys():
            if lab not in ["users", "reports", "borrow_requests"]:
                lab_items.update(data[lab])
        
        item = lab_items.get(item_req.id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_req.id} not found")
        if item_req.quantity > item.get("quantity", 0):
            raise HTTPException(status_code=400, detail=f"Insufficient quantity for item {item_req.id}")

    request_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    # Store request with QR code
    req.user_id = user["id"]
    req.username = user["username"]
    req.created_at = now
    
    # Generate QR code with receipt URL
    base_url = "http://localhost:5173"  # Frontend URL (should match your frontend)
    receipt_url = f"{base_url}/receipt/{request_id}"
    qr_code = generate_qr_code(receipt_url)
    
    borrow_requests[request_id] = {
        **req.dict(),
        "id": request_id,
        "qr_code": qr_code
    }
    
    storage._save(data)
    return borrow_requests[request_id]

@router.post("/{request_id}/approve")
def approve_request(request_id: str, user = Depends(require_role(["admin", "technician"]))):
    data = storage._load()
    borrow_requests = data.get("borrow_requests", {})
    request = borrow_requests.get(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Borrow request not found")
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is not in pending state")

    # Update item quantities
    for item_req in request["items"]:
        # Find item in any lab
        found = False
        for lab in data.keys():
            if lab not in ["users", "reports", "borrow_requests"]:
                items = data[lab]
                if item_req["id"] in items:
                    item = items[item_req["id"]]
                    if item["quantity"] < item_req["quantity"]:
                        raise HTTPException(status_code=400, detail=f"Insufficient quantity for item {item_req['id']}")
                    item["quantity"] -= item_req["quantity"]
                    found = True
                    break
        if not found:
            raise HTTPException(status_code=404, detail=f"Item {item_req['id']} not found")

    request["status"] = "approved"
    storage._save(data)
    return request

@router.post("/{request_id}/cancel")
def cancel_request(request_id: str, user = Depends(get_current_user)):
    data = storage._load()
    borrow_requests = data.get("borrow_requests", {})
    request = borrow_requests.get(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Borrow request not found")
    if request["status"] not in ["pending", "approved"]:
        raise HTTPException(status_code=400, detail="Request cannot be cancelled")
    
    # Admin/tech can cancel any request
    if user["role"] in ["admin", "technician"]:
        pass
    # Users can only cancel their own pending requests
    elif user["role"] == "user":
        if request["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Cannot cancel other user's requests")
        if request["status"] == "approved":
            raise HTTPException(status_code=403, detail="Cannot cancel approved requests. Please contact an admin or technician.")
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Restore quantities if request was approved
    if request["status"] == "approved":
        for item_req in request["items"]:
            # Find item in any lab
            for lab in data.keys():
                if lab not in ["users", "reports", "borrow_requests"]:
                    items = data[lab]
                    if item_req["id"] in items:
                        items[item_req["id"]]["quantity"] += item_req["quantity"]
                        break

    request["status"] = "cancelled"
    storage._save(data)
    return request

@router.post("/{request_id}/return")
def return_request(request_id: str, user = Depends(require_role(["admin", "technician"]))):
    data = storage._load()
    borrow_requests = data.get("borrow_requests", {})
    request = borrow_requests.get(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Borrow request not found")
    if request["status"] != "approved":
        raise HTTPException(status_code=400, detail="Request is not in approved state")

    # Restore item quantities
    for item_req in request["items"]:
        # Find item in any lab
        for lab in data.keys():
            if lab not in ["users", "reports", "borrow_requests"]:
                items = data[lab]
                if item_req["id"] in items:
                    items[item_req["id"]]["quantity"] += item_req["quantity"]
                    break

    request["status"] = "returned"
    storage._save(data)
    return request
