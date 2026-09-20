from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from backend.services.planning_service import generate_study_plan
from backend.models import StudyPlan

class PlanningAgent:
    """Agent responsible for scheduling daily study blocks aligned with exam urgency and gaps."""

    @staticmethod
    def create_plan(
        db: Session,
        user_id: str,
        subject: str = "Data Structures",
        exam_date: Optional[str] = None,
        daily_study_hours: float = 2.0
    ) -> StudyPlan:
        return generate_study_plan(
            db=db,
            user_id=user_id,
            subject=subject,
            exam_date=exam_date,
            daily_study_hours=daily_study_hours
        )
