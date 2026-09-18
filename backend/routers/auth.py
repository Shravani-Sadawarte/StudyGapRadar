from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Profile
from backend.schemas import SignUpRequest, LoginRequest, TokenResponse, UserResponse, ApiResponse
from backend.utils.security import hash_password, verify_password, create_access_token
from backend.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        plan="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default profile
    profile = Profile(
        user_id=user.id,
        branch="Computer Science & Engineering",
        semester="Semester 5",
        subject="Data Structures",
        exam_name="Semester Exams"
    )
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "plan": user.plan or "free",
            "ai_questions_used": 0,
            "ai_question_limit": 3,
            "branch": profile.branch,
            "semester": profile.semester,
            "exam_goal": profile.exam_name,
            "subject": profile.subject
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "plan": user.plan,
            "ai_questions_used": getattr(user, "ai_questions_used", 0) or 0,
            "ai_question_limit": getattr(user, "ai_question_limit", 3),
            "branch": profile.branch if profile else "",
            "semester": profile.semester if profile else "",
            "exam_goal": profile.exam_name if profile else "",
            "subject": profile.subject if profile else "Data Structures"
        }
    }

@router.post("/logout", response_model=ApiResponse)
def logout():
    return ApiResponse(success=True, message="Successfully signed out")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        plan=current_user.plan or "free",
        ai_questions_used=getattr(current_user, "ai_questions_used", 0) or 0,
        ai_question_limit=None if current_user.plan == "premium" else (getattr(current_user, "ai_question_limit", 3) or 3),
        branch=profile.branch if profile else "",
        semester=profile.semester if profile else "",
        exam_goal=profile.exam_name if profile else "",
        subject=profile.subject if profile else "Data Structures"
    )

@router.post("/upgrade", response_model=ApiResponse)
def upgrade_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Upgrade authenticated user to Premium with unlimited AI access."""
    current_user.plan = "premium"
    current_user.ai_question_limit = None
    db.commit()
    db.refresh(current_user)

    return ApiResponse(
        success=True,
        message="Successfully upgraded to StudyGapRadar Premium!",
        data={
            "plan": current_user.plan,
            "is_premium": True,
            "ai_questions_used": getattr(current_user, "ai_questions_used", 0) or 0,
            "ai_question_limit": None
        }
    )
