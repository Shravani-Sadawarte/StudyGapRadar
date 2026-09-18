from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import TutorAskRequest, TutorResponse, ApiResponse
from backend.auth import get_current_user
from backend.agents.tutor_agent import answer_tutor_query
from backend.services.subscription_service import (
    can_ask_ai_question,
    increment_ai_question_usage,
    is_premium,
    get_ai_question_limit,
    FREE_AI_QUESTION_LIMIT,
)

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])

@router.get("/usage", response_model=ApiResponse)
def get_tutor_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the student's current AI question usage and quota status."""
    used = getattr(current_user, "ai_questions_used", 0) or 0
    premium = is_premium(current_user)
    limit = get_ai_question_limit(current_user)
    remaining = None if premium else max(0, FREE_AI_QUESTION_LIMIT - used)

    return ApiResponse(
        success=True,
        message="AI Tutor usage retrieved.",
        data={
            "plan": current_user.plan or "free",
            "is_premium": premium,
            "ai_questions_used": used,
            "ai_question_limit": limit,
            "remaining_questions": remaining,
        }
    )

@router.post("/ask", response_model=ApiResponse)
def ask_tutor(
    req: TutorAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Check Plan and Usage Limits
    can_ask, reason, used, limit = can_ask_ai_question(current_user)
    if not can_ask:
        return ApiResponse(
            success=False,
            code="AI_LIMIT_REACHED",
            upgrade_required=True,
            message="You have used your 3 free AI Tutor questions.",
            data={
                "code": "AI_LIMIT_REACHED",
                "upgrade_required": True,
                "ai_questions_used": used,
                "ai_question_limit": limit,
                "plan": current_user.plan or "free",
            }
        )

    # Generate Tutor Answer
    result = answer_tutor_query(
        db=db,
        user_id=current_user.id,
        question=req.question.strip(),
        topic=req.topic,
        mode=req.mode or "explain_simply"
    )

    # Safely increment usage on backend
    new_used = increment_ai_question_usage(db, current_user)
    premium = is_premium(current_user)
    result["ai_questions_used"] = new_used
    result["ai_question_limit"] = get_ai_question_limit(current_user)
    result["plan"] = current_user.plan or "free"
    result["is_premium"] = premium
    result["remaining_questions"] = None if premium else max(0, FREE_AI_QUESTION_LIMIT - new_used)

    return ApiResponse(
        success=True,
        message="AI Tutor response generated.",
        data=result
    )
