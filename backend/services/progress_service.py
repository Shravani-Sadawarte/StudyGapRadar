from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from backend.models import AgentEvent, StudySession, ProgressLog, StudyPlan, TopicMastery, Profile

def log_agent_event(db: Session, user_id: Optional[str], agent_name: str, action: str, detail: str):
    """Log an event from any of the 8 agents in the system."""
    event = AgentEvent(
        user_id=user_id,
        agent_name=agent_name,
        action=action,
        detail=detail,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    return event

def record_session_completion(
    db: Session,
    user_id: str,
    session_id: str,
    duration_minutes: Optional[int] = None,
    reflection: Optional[str] = None
) -> StudySession:
    """Mark a study session as completed and log student progress."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == user_id
    ).first()

    if session:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        if reflection:
            session.reflection = reflection
        if duration_minutes:
            session.duration_minutes = duration_minutes

        # Create progress log
        log = ProgressLog(
            user_id=user_id,
            session_id=session.id,
            topic=session.topic,
            activity=session.activity,
            duration_minutes=session.duration_minutes,
            reflection=reflection,
            date=date.today().isoformat()
        )
        db.add(log)

        # Log agent event
        log_agent_event(
            db=db,
            user_id=user_id,
            agent_name="ProgressAgent",
            action="Session Completed",
            detail=f"Completed {session.duration_minutes}-minute session on '{session.topic}' ({session.activity})."
        )
        db.commit()
        db.refresh(session)

    return session

def get_dashboard_metrics(db: Session, user_id: str) -> Dict[str, Any]:
    """Calculate and return live dashboard metrics for a student."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    today_str = date.today().isoformat()

    # Active study plan
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id,
        StudyPlan.status == "active"
    ).order_by(StudyPlan.generated_at.desc()).first()

    today_sessions = []
    minutes_planned = 0
    minutes_completed = 0

    if plan:
        sessions = db.query(StudySession).filter(
            StudySession.plan_id == plan.id
        ).all()
        # Find today's sessions or upcoming pending sessions
        today_sessions = [s for s in sessions if s.date == today_str]
        if not today_sessions:
            today_sessions = [s for s in sessions if s.status == "pending"][:3]

        minutes_planned = sum(s.duration_minutes for s in today_sessions)
        minutes_completed = sum(s.duration_minutes for s in today_sessions if s.status == "completed")

    # Topic masteries
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == user_id).all()
    overall_mastery = (
        round(sum(m.mastery_percentage for m in masteries) / len(masteries), 1)
        if masteries else 0.0
    )

    weak_topics = [m.topic_name for m in masteries if m.status == "needs-attention"]
    strong_topics = [m.topic_name for m in masteries if m.status == "solid"]

    # Days remaining until exam
    days_remaining = 14
    if profile and profile.exam_date:
        try:
            exam_d = datetime.strptime(profile.exam_date, "%Y-%m-%d").date()
            diff = (exam_d - date.today()).days
            days_remaining = max(0, diff)
        except Exception:
            pass

    # Recommended next action
    if weak_topics:
        recommended = f"Practice {weak_topics[0]} to resolve critical diagnostic knowledge gaps."
    elif today_sessions and today_sessions[0].status == "pending":
        recommended = f"Complete scheduled session: {today_sessions[0].topic} ({today_sessions[0].activity})."
    else:
        recommended = "Take a diagnostic assessment to identify high-priority revision topics."

    # Readiness
    if overall_mastery >= 75:
        readiness = "High Readiness"
    elif overall_mastery >= 45:
        readiness = "Moderate Readiness — Focus on Priority Topics"
    elif masteries:
        readiness = "Needs Immediate Focus"
    else:
        readiness = "Not Assessed Yet"

    serialized_today_sessions = [
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
        for s in today_sessions
    ]

    return {
        "user_name": profile.user.name if profile and profile.user else "Student",
        "subject": profile.subject if profile else "Data Structures",
        "semester": profile.semester if profile else "Semester 5",
        "branch": profile.branch if profile else "Computer Science & Engineering",
        "exam_name": profile.exam_name if profile else "Semester Exams",
        "exam_date": profile.exam_date if profile else None,
        "days_remaining": days_remaining,
        "current_mastery": overall_mastery,
        "streak_days": 3 if minutes_completed > 0 else 1,
        "minutes_planned_today": minutes_planned,
        "minutes_completed_today": minutes_completed,
        "today_sessions": serialized_today_sessions,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommended_next_action": recommended,
        "readiness_indicator": readiness
    }
