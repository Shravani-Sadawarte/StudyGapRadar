from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple, Optional
from backend.services.assessment_service import generate_diagnostic, submit_diagnostic
from backend.models import Question, QuizAttempt
import json

class AssessmentAgent:
    """Agent responsible for crafting balanced assessments and diagnostic evaluations."""

    @staticmethod
    def create_diagnostic(
        db: Session,
        user_id: str,
        subject: str,
        topics: List[str],
        exam_date: Optional[str] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        attempt, questions = generate_diagnostic(db, user_id, subject, topics, exam_date)
        return attempt.id, questions

    @staticmethod
    def evaluate_diagnostic(
        db: Session,
        user_id: str,
        attempt_id: str,
        answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        return submit_diagnostic(db, user_id, attempt_id, answers)

    @staticmethod
    def create_quiz(db: Session, topic: str, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generate targeted quiz questions for a specific weak topic."""
        qs = db.query(Question).filter(Question.topic_name == topic).all()
        if not qs:
            qs = db.query(Question).all()[:4]

        return [
            {
                "id": q.id,
                "topic": q.topic_name,
                "prompt": q.prompt,
                "options": json.loads(q.options_json),
                "difficulty": q.difficulty
            }
            for q in qs[:5]
        ]
