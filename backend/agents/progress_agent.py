from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from backend.services.progress_service import record_session_completion, get_dashboard_metrics

class ProgressAgent:
    """Agent responsible for tracking student milestone completion, logging study time, and maintaining streaks."""

    @staticmethod
    def complete_session(
        db: Session,
        user_id: str,
        session_id: str,
        duration_minutes: Optional[int] = None,
        reflection: Optional[str] = None
    ) -> Dict[str, Any]:
        session = record_session_completion(db, user_id, session_id, duration_minutes, reflection)
        return {
            "session_id": session.id,
            "status": session.status,
            "topic": session.topic,
            "activity": session.activity,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None
        }

    @staticmethod
    def get_dashboard(db: Session, user_id: str) -> Dict[str, Any]:
        return get_dashboard_metrics(db, user_id)
