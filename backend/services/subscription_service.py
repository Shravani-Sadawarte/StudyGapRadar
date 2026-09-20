from sqlalchemy.orm import Session
from typing import Tuple, Optional
from backend.models import User

FREE_AI_QUESTION_LIMIT = 3

def is_premium(user: User) -> bool:
    """Check if a user has an active premium subscription."""
    if not user:
        return False
    return getattr(user, "plan", "free") == "premium"

def get_ai_question_limit(user: User) -> Optional[int]:
    """Get question limit: None for premium (unlimited), 3 for free users."""
    if is_premium(user):
        return None
    limit = getattr(user, "ai_question_limit", None)
    return limit if limit is not None else FREE_AI_QUESTION_LIMIT

def can_ask_ai_question(user: User) -> Tuple[bool, str, int, Optional[int]]:
    """
    Check if the user is permitted to ask an AI question.
    Returns: (allowed, reason, used_count, limit)
    """
    used = getattr(user, "ai_questions_used", 0) or 0
    limit = get_ai_question_limit(user)

    if is_premium(user):
        return True, "Premium user with unlimited AI study access.", used, None

    if used >= FREE_AI_QUESTION_LIMIT:
        return (
            False,
            f"You've used your {FREE_AI_QUESTION_LIMIT} free AI Tutor questions. Upgrade to Premium for expanded AI study support.",
            used,
            FREE_AI_QUESTION_LIMIT
        )

    return True, f"{FREE_AI_QUESTION_LIMIT - used} free questions remaining.", used, FREE_AI_QUESTION_LIMIT

def increment_ai_question_usage(db: Session, user: User) -> int:
    """Safely increment AI question usage count for the user in the database."""
    current = getattr(user, "ai_questions_used", 0) or 0
    user.ai_questions_used = current + 1
    db.commit()
    db.refresh(user)
    return user.ai_questions_used

def upgrade_user_to_premium(db: Session, user: User) -> User:
    """Upgrade user plan to premium and set limit to unlimited (None)."""
    user.plan = "premium"
    user.ai_question_limit = None
    db.commit()
    db.refresh(user)
    return user
