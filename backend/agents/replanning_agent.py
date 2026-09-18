from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, Tuple
from backend.services.planning_service import adapt_study_plan
from backend.models import StudyPlan

class ReplanningAgent:
    """Agent responsible for dynamic adaptive replanning in response to quiz outcomes and schedule disruptions."""

    @staticmethod
    def replan(
        db: Session,
        user_id: str,
        reason: str,
        topic: Optional[str] = None,
        quiz_score: Optional[float] = None
    ) -> Tuple[StudyPlan, str]:
        return adapt_study_plan(
            db=db,
            user_id=user_id,
            reason=reason,
            topic=topic,
            quiz_score=quiz_score
        )
