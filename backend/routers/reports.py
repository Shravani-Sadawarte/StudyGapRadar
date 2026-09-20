from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, QuestionReport
from backend.schemas import QuestionReportRequest, ApiResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Moderation"])

@router.post("/questions", response_model=ApiResponse)
def report_question(
    req: QuestionReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = QuestionReport(
        user_id=current_user.id,
        question_id=req.question_id,
        topic=req.topic,
        reason=req.reason,
        note=req.note
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ApiResponse(
        success=True,
        message="Question report submitted for review.",
        data={"id": report.id, "status": report.status}
    )

@router.get("/my-reports", response_model=ApiResponse)
def get_user_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(QuestionReport).filter(QuestionReport.user_id == current_user.id).order_by(QuestionReport.created_at.desc()).all()
    return ApiResponse(
        success=True,
        message="Reported questions retrieved",
        data=[
            {
                "id": r.id,
                "question_id": r.question_id,
                "topic": r.topic,
                "reason": r.reason,
                "note": r.note,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
    )
