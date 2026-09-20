from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.database import get_db
from backend.models import User, AssessmentAttempt, AssessmentAnswer, Question
from backend.schemas import (
    DiagnosticGenerateRequest,
    DiagnosticSubmitRequest,
    ApiResponse,
    QuestionSchema
)
from backend.auth import get_current_user
from backend.agents.assessment_agent import AssessmentAgent
from backend.agents.knowledge_agent import KnowledgeAgent
from backend.agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/api/diagnostic", tags=["Diagnostic Assessment"])

@router.post("/generate", response_model=ApiResponse)
def generate_diagnostic_session(
    req: DiagnosticGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt_id, questions = AssessmentAgent.create_diagnostic(
        db=db,
        user_id=current_user.id,
        subject=req.subject_name,
        topics=req.topics,
        exam_date=req.exam_date
    )
    return ApiResponse(
        success=True,
        message="Diagnostic session generated.",
        data={
            "attempt_id": attempt_id,
            "subject": req.subject_name,
            "exam_date": req.exam_date,
            "questions": questions
        }
    )

@router.get("/current", response_model=ApiResponse)
def get_current_diagnostic(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id,
        AssessmentAttempt.status == "in_progress"
    ).order_by(AssessmentAttempt.created_at.desc()).first()

    if not attempt:
        return ApiResponse(success=False, message="No diagnostic in progress", data=None)

    questions = db.query(Question).filter(Question.question_type == "diagnostic").all()
    import json
    return ApiResponse(
        success=True,
        message="Current diagnostic retrieved",
        data={
            "attempt_id": attempt.id,
            "subject": attempt.subject_name,
            "exam_date": attempt.exam_date,
            "questions": [
                {
                    "id": q.id,
                    "topic": q.topic_name,
                    "prompt": q.prompt,
                    "options": json.loads(q.options_json),
                    "difficulty": q.difficulty
                }
                for q in questions
            ]
        }
    )

@router.post("/submit", response_model=ApiResponse)
def submit_diagnostic_answers(
    req: DiagnosticSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_answers = [{"question_id": a.question_id, "selected_index": a.selected_index} for a in req.answers]
    diag_result, plan = OrchestratorAgent.on_diagnostic_submitted(
        db=db,
        user_id=current_user.id,
        attempt_id=req.attempt_id,
        answers=raw_answers
    )
    return ApiResponse(
        success=True,
        message="Diagnostic completed and scored.",
        data=diag_result
    )

@router.get("/results", response_model=ApiResponse)
def get_diagnostic_results(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    knowledge_state = KnowledgeAgent.get_knowledge_state(db, current_user.id)
    return ApiResponse(
        success=True,
        message="Latest diagnostic results retrieved",
        data=knowledge_state
    )
