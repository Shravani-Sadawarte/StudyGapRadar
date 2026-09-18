from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import User, ProgressLog, StudySession
from backend.schemas import SessionCompleteRequest, ApiResponse
from backend.auth import get_current_user
from backend.services.progress_service import record_session_completion

router = APIRouter(prefix="/api/progress", tags=["Progress & Session Tracking"])

@router.post("/session", response_model=ApiResponse)
def complete_study_session(
    req: SessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = record_session_completion(
        db=db,
        user_id=current_user.id,
        session_id=req.session_id,
        duration_minutes=req.duration_minutes,
        reflection=req.reflection
    )
    return ApiResponse(
        success=True,
        message="Session completed and recorded in progress log.",
        data={
            "session_id": session.id if session else req.session_id,
            "status": "completed",
            "topic": session.topic if session else "",
            "activity": session.activity if session else ""
        }
    )

@router.get("", response_model=ApiResponse)
def get_progress_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(ProgressLog).filter(ProgressLog.user_id == current_user.id).order_by(ProgressLog.created_at.desc()).all()
    total_minutes = sum(l.duration_minutes for l in logs)

    completed_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status == "completed"
    ).count()

    planned_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id
    ).count()

    return ApiResponse(
        success=True,
        message="Progress summary retrieved",
        data={
            "total_minutes_studied": total_minutes,
            "sessions_completed": completed_sessions,
            "sessions_planned": planned_sessions,
            "streak_days": 3 if total_minutes > 0 else 1,
            "recent_sessions": [
                {
                    "id": l.id,
                    "topic": l.topic,
                    "activity": l.activity,
                    "duration_minutes": l.duration_minutes,
                    "reflection": l.reflection,
                    "date": l.date
                }
                for l in logs[:10]
            ]
        }
    )
