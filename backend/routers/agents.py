from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import User, AgentEvent
from backend.schemas import ApiResponse, AgentEventSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/agents", tags=["Agent System & Events"])

@router.get("/events", response_model=ApiResponse)
def get_agent_events(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = (
        db.query(AgentEvent)
        .filter(AgentEvent.user_id == current_user.id)
        .order_by(AgentEvent.created_at.desc())
        .limit(25)
        .all()
    )

    return ApiResponse(
        success=True,
        message="Agent activity events retrieved",
        data=[
            {
                "id": e.id,
                "agent_name": e.agent_name,
                "action": e.action,
                "detail": e.detail,
                "created_at": e.created_at.isoformat()
            }
            for e in events
        ]
    )
