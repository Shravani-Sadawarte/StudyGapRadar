from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.models import TopicMastery, AssessmentAttempt, AssessmentAnswer, Question
import json

class KnowledgeAgent:
    """Agent responsible for calculating topic mastery, severity, urgency, and identifying knowledge gaps."""

    @staticmethod
    def get_knowledge_state(db: Session, user_id: str) -> Dict[str, Any]:
        masteries = db.query(TopicMastery).filter(TopicMastery.user_id == user_id).order_by(TopicMastery.priority_score.desc()).all()
        
        # Get latest completed assessment attempt to gather evidence answers
        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == user_id,
            AssessmentAttempt.status == "completed"
        ).order_by(AssessmentAttempt.completed_at.desc()).first()

        attempt_answers = []
        if attempt:
            db_answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.attempt_id == attempt.id).all()
            for a in db_answers:
                q = db.query(Question).filter(Question.id == a.question_id).first()
                if q:
                    attempt_answers.append({
                        "topic": a.topic_name,
                        "question_id": q.id,
                        "prompt": q.prompt,
                        "options": json.loads(q.options_json),
                        "selected_index": a.selected_index,
                        "correct_index": q.correct_index,
                        "status": a.status,
                        "explanation": q.explanation
                    })

        topics_data = []
        for m in masteries:
            topic_evidence = [ans for ans in attempt_answers if ans["topic"] == m.topic_name]
            topics_data.append({
                "topic": m.topic_name,
                "correct": m.correct_count,
                "attempted": m.attempted_count,
                "total": m.total_count,
                "status": m.status,
                "mastery_percentage": m.mastery_percentage,
                "severity": round(m.severity, 2),
                "urgency": round(m.urgency, 2),
                "priority_score": round(m.priority_score, 3),
                "recommended_action": m.recommended_action,
                "answers": topic_evidence
            })

        overall = (
            round(sum(m.mastery_percentage for m in masteries) / len(masteries), 1)
            if masteries else 0.0
        )

        strengths = [m.topic_name for m in masteries if m.status == "solid"]
        weaknesses = [m.topic_name for m in masteries if m.status == "needs-attention"]

        return {
            "subject": masteries[0].subject_name if masteries else "Data Structures",
            "exam_date": attempt.exam_date if attempt else None,
            "topics": topics_data,
            "overall_mastery": overall,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "priority_topics": [t for t in topics_data if t["status"] == "needs-attention"],
            "created_at": attempt.completed_at.isoformat() if attempt and attempt.completed_at else ""
        }
