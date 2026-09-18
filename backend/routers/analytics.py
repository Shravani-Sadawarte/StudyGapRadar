from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import ApiResponse
from backend.auth import get_current_user
from backend.services.progress_service import get_dashboard_metrics

router = APIRouter(prefix="/api/analytics", tags=["Dashboard & Analytics"])

@router.get("/dashboard", response_model=ApiResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = get_dashboard_metrics(db, current_user.id)
    return ApiResponse(
        success=True,
        message="Dashboard analytics retrieved",
        data=metrics
    )
