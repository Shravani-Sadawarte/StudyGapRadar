from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import User, Question, QuizAttempt
from backend.schemas import QuizGenerateRequest, QuizSubmitRequest, ApiResponse
from backend.auth import get_current_user
from backend.agents.assessment_agent import AssessmentAgent
from backend.agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/api/quiz", tags=["Quizzes & Practice"])

@router.post("/generate", response_model=ApiResponse)
def generate_quiz(
    req: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    questions = AssessmentAgent.create_quiz(db, topic=req.topic, difficulty=req.difficulty or "medium")
    return ApiResponse(
        success=True,
        message=f"Generated quiz for {req.topic}",
        data={
            "topic": req.topic,
            "questions": questions
        }
    )

@router.post("/submit", response_model=ApiResponse)
def submit_quiz(
    req: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    correct_count = 0
    total = len(req.answers)

    for ans in req.answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if q and ans.selected_index == q.correct_index:
            correct_count += 1

    # Orchestrator handles quiz evaluation and triggers replanning if needed
    result = OrchestratorAgent.on_quiz_completed(
        db=db,
        user_id=current_user.id,
        topic=req.topic,
        score=correct_count,
        total=total
    )

    # Record quiz attempt
    attempt = QuizAttempt(
        user_id=current_user.id,
        topic=req.topic,
        score=correct_count,
        total_questions=total,
        percentage=result["percentage"]
    )
    db.add(attempt)
    db.commit()

    return ApiResponse(
        success=True,
        message="Quiz submitted and evaluated.",
        data=result
    )

@router.get("/results", response_model=ApiResponse)
def get_quiz_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).order_by(QuizAttempt.completed_at.desc()).all()
    return ApiResponse(
        success=True,
        message="Quiz history retrieved",
        data=[
            {
                "id": a.id,
                "topic": a.topic,
                "score": a.score,
                "total_questions": a.total_questions,
                "percentage": a.percentage,
                "completed_at": a.completed_at.isoformat()
            }
            for a in attempts
        ]
    )
