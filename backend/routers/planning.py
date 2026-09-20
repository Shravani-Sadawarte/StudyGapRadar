from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.database import get_db
from backend.models import User, StudyPlan, StudySession
from backend.schemas import (
    StudyPlanGenerateRequest,
    StudyPlanResponse,
    StudySessionSchema,
    ReplanRequest,
    ReplanResponse,
    ApiResponse
)
from backend.auth import get_current_user
from backend.agents.planning_agent import PlanningAgent
from backend.agents.replanning_agent import ReplanningAgent

router = APIRouter(prefix="/api/plan", tags=["Study Planning & Adaptive Replanning"])

def serialize_plan(plan: StudyPlan) -> Dict[str, Any]:
    return {
        "id": plan.id,
        "subject": plan.subject_name,
        "exam_date": plan.exam_date,
        "days_remaining": plan.days_remaining,
        "daily_study_hours": plan.daily_study_hours,
        "total_allocated_minutes": plan.total_allocated_minutes,
        "status": plan.status,
        "sessions": [
            {
                "id": s.id,
                "date": s.date,
                "day_number": s.day_number,
                "subject": s.subject,
                "topic": s.topic,
                "activity": s.activity,
                "duration_minutes": s.duration_minutes,
                "priority": s.priority,
                "objective": s.objective,
                "status": s.status,
                "reflection": s.reflection
            }
            for s in plan.sessions
        ]
    }

@router.post("/generate", response_model=ApiResponse)
def create_plan(
    req: StudyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = PlanningAgent.create_plan(
        db=db,
        user_id=current_user.id,
        subject=req.subject,
        exam_date=req.exam_date,
        daily_study_hours=req.daily_study_hours or 2.0
    )
    return ApiResponse(
        success=True,
        message="Personalized study plan generated successfully.",
        data=serialize_plan(plan)
    )

@router.get("", response_model=ApiResponse)
def get_current_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.status == "active"
    ).order_by(StudyPlan.generated_at.desc()).first()

    if not plan:
        # Auto-generate if none exists
        plan = PlanningAgent.create_plan(db, current_user.id)

    return ApiResponse(
        success=True,
        message="Current study plan retrieved.",
        data=serialize_plan(plan)
    )

@router.post("/replan", response_model=ApiResponse)
def trigger_adaptive_replanning(
    req: ReplanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan, explanation = ReplanningAgent.replan(
        db=db,
        user_id=current_user.id,
        reason=req.reason,
        topic=req.topic,
        quiz_score=req.quiz_score
    )
    return ApiResponse(
        success=True,
        message="Study plan adapted successfully.",
        data={
            "plan": serialize_plan(plan),
            "explanation": explanation
        }
    )
