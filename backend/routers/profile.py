from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Profile
from backend.schemas import ProfileUpdateRequest, ProfileResponse, ApiResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile & Onboarding"])

@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return ProfileResponse(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        plan=current_user.plan or "free",
        ai_questions_used=getattr(current_user, "ai_questions_used", 0) or 0,
        ai_question_limit=None if current_user.plan == "premium" else (getattr(current_user, "ai_question_limit", 3) or 3),
        branch=profile.branch,
        semester=profile.semester,
        subject=profile.subject,
        exam_name=profile.exam_name,
        exam_date=profile.exam_date,
        daily_study_hours=profile.daily_study_hours,
        current_confidence=profile.current_confidence,
        learning_goal=profile.learning_goal,
        preferred_learning_style=profile.preferred_learning_style
    )

@router.post("", response_model=ProfileResponse)
@router.put("", response_model=ProfileResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    if req.name:
        current_user.name = req.name.strip()
    if req.plan:
        current_user.plan = req.plan
        if req.plan == "premium":
            current_user.ai_question_limit = None
    if req.branch is not None:
        profile.branch = req.branch
    if req.semester is not None:
        profile.semester = req.semester
    if req.subject is not None:
        profile.subject = req.subject
    if req.exam_name is not None:
        profile.exam_name = req.exam_name
    if req.exam_date is not None:
        profile.exam_date = req.exam_date
    if req.daily_study_hours is not None:
        profile.daily_study_hours = req.daily_study_hours
    if req.current_confidence is not None:
        profile.current_confidence = req.current_confidence
    if req.learning_goal is not None:
        profile.learning_goal = req.learning_goal
    if req.preferred_learning_style is not None:
        profile.preferred_learning_style = req.preferred_learning_style

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return ProfileResponse(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        plan=current_user.plan or "free",
        ai_questions_used=getattr(current_user, "ai_questions_used", 0) or 0,
        ai_question_limit=None if current_user.plan == "premium" else (getattr(current_user, "ai_question_limit", 3) or 3),
        branch=profile.branch,
        semester=profile.semester,
        subject=profile.subject,
        exam_name=profile.exam_name,
        exam_date=profile.exam_date,
        daily_study_hours=profile.daily_study_hours,
        current_confidence=profile.current_confidence,
        learning_goal=profile.learning_goal,
        preferred_learning_style=profile.preferred_learning_style
    )
