from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import ApiResponse
from backend.auth import get_current_user
from backend.agents.knowledge_agent import KnowledgeAgent

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Analysis"])

@router.get("/results", response_model=ApiResponse)
def get_knowledge_results(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = KnowledgeAgent.get_knowledge_state(db, current_user.id)
    return ApiResponse(
        success=True,
        message="Knowledge gaps and topic mastery retrieved.",
        data=results
    )
