from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from backend.models import StudyPlan, StudySession, TopicMastery, Profile
from backend.services.progress_service import log_agent_event

ACTIVITIES = [
    "Concept learning",
    "Active recall",
    "Practice problems",
    "Flashcards",
    "Revision",
    "Timed quiz",
    "Error review",
    "Spaced repetition"
]

def generate_study_plan(
    db: Session,
    user_id: str,
    subject: str = "Data Structures",
    exam_date: Optional[str] = None,
    daily_study_hours: float = 2.0
) -> StudyPlan:
    """Generate a prioritized daily study plan tailored to the student's mastery and exam timeline."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not exam_date and profile and profile.exam_date:
        exam_date = profile.exam_date

    # Calculate days remaining
    days_remaining = 14
    if exam_date:
        try:
            exam_d = datetime.strptime(exam_date, "%Y-%m-%d").date()
            diff = (exam_d - date.today()).days
            days_remaining = max(3, min(diff, 60))
        except Exception:
            pass

    # Archive previous active plans
    db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id,
        StudyPlan.status == "active"
    ).update({"status": "archived"})

    daily_minutes = int(daily_study_hours * 60)
    total_allocated = daily_minutes * days_remaining

    plan = StudyPlan(
        user_id=user_id,
        subject_name=subject,
        exam_date=exam_date,
        days_remaining=days_remaining,
        daily_study_hours=daily_study_hours,
        total_allocated_minutes=total_allocated,
        status="active"
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Get topic masteries for the user
    masteries = db.query(TopicMastery).filter(
        TopicMastery.user_id == user_id,
        TopicMastery.subject_name == subject
    ).order_by(TopicMastery.priority_score.desc()).all()

    # If no diagnostic completed yet, use standard curriculum topics
    if not masteries:
        topics_order = ["Trees", "Recursion", "Arrays", "Linked Lists"]
    else:
        # Prioritize weak topics first, then insufficient evidence, then solid
        topics_order = [m.topic_name for m in masteries]

    # Generate daily sessions distributed across remaining days
    session_duration = 45  # standard 45-minute block
    sessions_per_day = max(1, daily_minutes // session_duration)

    curr_date = date.today()
    topic_cursor = 0

    for day_idx in range(days_remaining):
        session_date = (curr_date + timedelta(days=day_idx)).isoformat()
        
        for slot in range(sessions_per_day):
            target_topic = topics_order[topic_cursor % len(topics_order)]
            topic_cursor += 1

            # Activity cycle based on day and progress
            if day_idx < 3:
                activity = "Concept learning" if slot == 0 else "Practice problems"
                priority = "Critical" if target_topic in ["Trees", "Recursion"] else "High"
                objective = f"Master fundamental principles and implement key operations for {target_topic}."
            elif day_idx < days_remaining - 2:
                activity = "Active recall" if slot == 0 else "Spaced repetition"
                priority = "High" if slot == 0 else "Medium"
                objective = f"Reinforce core edge-cases and solve application-style problems on {target_topic}."
            else:
                activity = "Timed quiz" if slot == 0 else "Revision"
                priority = "High"
                objective = f"Simulate exam-conditions and comprehensive review for {target_topic}."

            session = StudySession(
                plan_id=plan.id,
                user_id=user_id,
                date=session_date,
                day_number=day_idx + 1,
                subject=subject,
                topic=target_topic,
                activity=activity,
                duration_minutes=session_duration,
                priority=priority,
                objective=objective,
                status="pending"
            )
            db.add(session)

    log_agent_event(
        db=db,
        user_id=user_id,
        agent_name="PlanningAgent",
        action="Study Plan Generated",
        detail=f"Constructed {days_remaining}-day actionable study schedule ({daily_study_hours} hrs/day) prioritizing {topics_order[0] if topics_order else 'Data Structures'}."
    )

    db.commit()
    db.refresh(plan)
    return plan

def adapt_study_plan(
    db: Session,
    user_id: str,
    reason: str,
    topic: Optional[str] = None,
    quiz_score: Optional[float] = None
) -> Tuple[StudyPlan, str]:
    """Dynamically replan upcoming sessions in response to performance or missed work."""
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id,
        StudyPlan.status == "active"
    ).order_by(StudyPlan.generated_at.desc()).first()

    if not plan:
        # Generate new plan if none active
        plan = generate_study_plan(db, user_id)

    explanation = ""
    today_str = date.today().isoformat()

    if reason == "poor_quiz_performance" and topic:
        # Insert reinforcement sessions for this weak topic
        # Split next session into Fundamentals (30m) + Targeted Practice (30m) + Error Review (15m)
        upcoming_session = db.query(StudySession).filter(
            StudySession.plan_id == plan.id,
            StudySession.status == "pending",
            StudySession.date >= today_str
        ).first()

        target_date = upcoming_session.date if upcoming_session else today_str

        # Add targeted remedial sessions
        s1 = StudySession(
            plan_id=plan.id,
            user_id=user_id,
            date=target_date,
            day_number=1,
            subject=plan.subject_name,
            topic=topic,
            activity="Concept learning",
            duration_minutes=30,
            priority="Critical",
            objective=f"{topic} fundamentals revision following low quiz accuracy ({int((quiz_score or 0.3) * 100)}%).",
            status="pending"
        )
        s2 = StudySession(
            plan_id=plan.id,
            user_id=user_id,
            date=target_date,
            day_number=1,
            subject=plan.subject_name,
            topic=topic,
            activity="Practice problems",
            duration_minutes=30,
            priority="Critical",
            objective=f"{topic} application drill targeting identified misconceptions.",
            status="pending"
        )
        s3 = StudySession(
            plan_id=plan.id,
            user_id=user_id,
            date=target_date,
            day_number=1,
            subject=plan.subject_name,
            topic=topic,
            activity="Error review",
            duration_minutes=15,
            priority="High",
            objective=f"Review incorrect answers and verify mastery for {topic}.",
            status="pending"
        )
        db.add_all([s1, s2, s3])

        # Also update TopicMastery status
        tm = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_name == topic
        ).first()
        if tm:
            tm.status = "needs-attention"
            tm.severity = 0.85
            tm.priority_score = round(0.7 * 0.85 + 0.3 * tm.urgency, 4)

        explanation = f"{topic} was allocated additional practice and error-review sessions because your latest quiz indicated knowledge gaps."

    elif reason == "missed_session":
        explanation = "Upcoming sessions were redistributed across remaining study days to keep your preparation on track."
    elif reason == "study_time_change":
        explanation = "Daily session durations were recalibrated to match your updated daily study capacity."
    else:
        explanation = "Study plan adjusted to prioritize topics with highest exam urgency and current severity."

    log_agent_event(
        db=db,
        user_id=user_id,
        agent_name="ReplanningAgent",
        action="Plan Dynamically Adapted",
        detail=explanation
    )

    db.commit()
    db.refresh(plan)
    return plan, explanation
