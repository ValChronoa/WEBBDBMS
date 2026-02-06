from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import uuid4
from datetime import datetime
from core.dependencies import storage, get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["reports"])

class ReportStatus(BaseModel):
    status: str

class ReportResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    message: str
    created_at: Optional[str] = None

class Report(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    username: Optional[str] = None
    lab: Optional[str] = None
    title: str
    description: str
    status: str = "open"
    created_at: Optional[str] = None
    responses: List[Dict[str, Any]] = []

@router.get("/", response_model=List[Dict[str, Any]])
def list_reports(user=Depends(get_current_user)):
    data = storage._load()
    reports = data.get("reports", {})
    # Sort by creation date, newest first
    reports_list = list(reports.values())
    reports_list.sort(key=lambda x: x["created_at"], reverse=True)
    return reports_list

@router.post("/", response_model=Dict[str, Any])
def create_report(report: Report, user=Depends(get_current_user)):
    data = storage._load()
    reports = data.setdefault("reports", {})
    report_id = str(uuid4())
    now = __import__('datetime').datetime.utcnow().isoformat()
    report.id = report_id
    report.user_id = user["id"]
    report.username = user["username"]
    report.created_at = now
    reports[report_id] = report.dict()
    storage._save(data)
    return report.dict()

@router.post("/{report_id}/respond", response_model=Dict[str, Any])
def add_response(report_id: str, response: ReportResponse, user = Depends(require_role(["admin", "technician"]))):
    data = storage._load()
    reports = data.get("reports", {})
    report = reports.get(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Create response
    response_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    response_data = {
        "id": response_id,
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "message": response.message,
        "created_at": now
    }
    
    # Initialize responses list if it doesn't exist
    if "responses" not in report:
        report["responses"] = []
    
    # Add response and update status
    report["responses"].append(response_data)
    report["status"] = "in-progress"  # Update status when responded to
    
    storage._save(data)
    return report

@router.put("/{report_id}/status", response_model=Dict[str, Any])
def update_report_status(report_id: str, status_update: ReportStatus, user = Depends(require_role(["admin", "technician"]))):
    data = storage._load()
    reports = data.get("reports", {})
    report = reports.get(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if status_update.status not in ["open", "in-progress", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be one of: open, in-progress, closed")
    
    # Add a status change response
    now = datetime.utcnow().isoformat()
    status_response = {
        "id": str(uuid4()),
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "message": f"Changed status to: {status_update.status}",
        "created_at": now
    }
    
    # Initialize responses list if it doesn't exist
    if "responses" not in report:
        report["responses"] = []
    
    # Update status and add response
    report["status"] = status_update.status
    report["responses"].append(status_response)
    
    storage._save(data)
    return report
