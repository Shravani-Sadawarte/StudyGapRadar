from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import User, Profile, Subject, Topic, Question, TopicMastery, StudyPlan, StudySession
from backend.utils.security import hash_password
from backend.services.assessment_service import seed_baseline_questions
from backend.services.planning_service import generate_study_plan

# Routers
from backend.routers import (
    auth,
    profile,
    materials,
    diagnostic,
    knowledge,
    planning,
    quiz,
    tutor,
    progress,
    analytics,
    agents,
    reports
)

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from sqlalchemy import text

# Create tables and run non-destructive schema migrations
Base.metadata.create_all(bind=engine)

def check_and_migrate_db():
    with engine.connect() as conn:
        try:
            cursor = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in cursor.fetchall()]
            if "ai_questions_used" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN ai_questions_used INTEGER DEFAULT 0"))
                logger.info("Migrated users table: added ai_questions_used")
            if "ai_question_limit" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN ai_question_limit INTEGER DEFAULT 3"))
                logger.info("Migrated users table: added ai_question_limit")
            conn.commit()
        except Exception as e:
            logger.warning(f"Database migration notice: {e}")

check_and_migrate_db()

def seed_initial_demo_data():
    """Seed initial demo user and default curriculum if not already present."""
    db = SessionLocal()
    try:
        # 1. Seed baseline questions
        seed_baseline_questions(db)

        # 2. Check for demo user
        demo = db.query(User).filter(User.email == "demo@studygapradar.app").first()
        if not demo:
            logger.info("Seeding initial Demo User Aarav Sharma...")
            demo = User(
                name="Aarav Sharma",
                email="demo@studygapradar.app",
                password_hash=hash_password("demo12345"),
                plan="free"
            )
            db.add(demo)
            db.commit()
            db.refresh(demo)

            demo_profile = Profile(
                user_id=demo.id,
                branch="Computer Science & Engineering",
                semester="Semester 5",
                subject="Data Structures",
                exam_name="Semester Exams",
                exam_date="2026-10-15",
                daily_study_hours=2.0,
                current_confidence="Moderate",
                learning_goal="Master core algorithms and score A+",
                preferred_learning_style="Application-oriented"
            )
            db.add(demo_profile)

            # Pre-seed topic masteries (Recursion needs attention, Arrays solid, Trees insufficient)
            tm1 = TopicMastery(
                user_id=demo.id,
                subject_name="Data Structures",
                topic_name="Recursion",
                correct_count=2,
                attempted_count=4,
                total_count=4,
                mastery_percentage=50.0,
                status="needs-attention",
                severity=0.5,
                urgency=0.6,
                priority_score=0.53,
                recommended_action="Practice Recursion application drills and base-case termination."
            )
            tm2 = TopicMastery(
                user_id=demo.id,
                subject_name="Data Structures",
                topic_name="Arrays",
                correct_count=4,
                attempted_count=4,
                total_count=4,
                mastery_percentage=100.0,
                status="solid",
                severity=0.0,
                urgency=0.6,
                priority_score=0.18,
                recommended_action="Mastery confirmed. Ready for timed exam review."
            )
            tm3 = TopicMastery(
                user_id=demo.id,
                subject_name="Data Structures",
                topic_name="Trees",
                correct_count=1,
                attempted_count=1,
                total_count=4,
                mastery_percentage=25.0,
                status="insufficient-evidence",
                severity=0.0,
                urgency=0.6,
                priority_score=0.18,
                recommended_action="Take diagnostic quiz to verify Tree traversal mastery."
            )
            db.add_all([tm1, tm2, tm3])
            db.commit()

            # Seed initial study plan for demo user
            generate_study_plan(db, demo.id, subject="Data Structures", exam_date="2026-10-15", daily_study_hours=2.0)
            logger.info("Demo user seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding initial data: {e}")
        db.rollback()
    finally:
        db.close()

seed_initial_demo_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for StudyGapRadar — AI-Powered Personalized Study Diagnostics & Adaptive Replanning"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": str(exc), "data": None}
    )

# Include All Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(materials.router)
app.include_router(diagnostic.router)
app.include_router(knowledge.router)
app.include_router(planning.router)
app.include_router(quiz.router)
app.include_router(tutor.router)
app.include_router(progress.router)
app.include_router(analytics.router)
app.include_router(agents.router)
app.include_router(reports.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
