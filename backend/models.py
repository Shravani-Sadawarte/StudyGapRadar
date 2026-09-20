from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float, SmallInteger
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default="free")  # "free" or "premium"
    ai_questions_used = Column(Integer, default=0)
    ai_question_limit = Column(Integer, default=3, nullable=True)  # None for unlimited (premium)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    mastery = relationship("TopicMastery", back_populates="user", cascade="all, delete-orphan")
    events = relationship("AgentEvent", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("QuestionReport", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    branch = Column(String(100), default="Computer Science & Engineering")
    semester = Column(String(50), default="Semester 5")
    subject = Column(String(100), default="Data Structures")
    exam_name = Column(String(100), default="Semester Exams")
    exam_date = Column(String(50), nullable=True)
    daily_study_hours = Column(Float, default=2.0)
    current_confidence = Column(String(50), default="Moderate")
    learning_goal = Column(String(255), default="Score above 85% in finals")
    preferred_learning_style = Column(String(50), default="Application-oriented")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=True)
    branch = Column(String(100), nullable=True)
    semester = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="subject", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    order_index = Column(Integer, default=0)
    importance = Column(String(20), default="High")  # "High", "Medium", "Low"
    difficulty = Column(String(20), default="Medium")  # "High", "Medium", "Low"
    prerequisites_json = Column(Text, default="[]")  # JSON list of prerequisite topic names
    summary = Column(Text, nullable=True)

    subject = relationship("Subject", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="topic", cascade="all, delete-orphan")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    importance = Column(String(20), default="Medium")

    topic = relationship("Topic", back_populates="concepts")


class Material(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="pdf")  # "pdf", "txt", "notes"
    raw_text = Column(Text, nullable=True)
    clean_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    topics_json = Column(Text, default="[]")  # extracted topics list
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="materials")
    subject = relationship("Subject", back_populates="materials")
    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")


class MaterialChunk(Base):
    __tablename__ = "material_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(100), nullable=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("Material", back_populates="chunks")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    topic_name = Column(String(100), nullable=False)
    prompt = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON list of 4 options
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium")  # "easy", "medium", "hard"
    question_type = Column(String(20), default="diagnostic")  # "diagnostic", "quiz", "practice"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("Topic", back_populates="questions")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    subject_name = Column(String(100), default="Data Structures")
    exam_date = Column(String(50), nullable=True)
    status = Column(String(30), default="in_progress")  # "in_progress", "completed"
    total_score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="assessments")
    answers = relationship("AssessmentAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(100), nullable=False)
    selected_index = Column(Integer, nullable=True)  # None = skipped
    status = Column(String(30), default="unattempted")  # "correct", "incorrect", "unattempted"
    created_at = Column(DateTime, default=datetime.utcnow)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("Question")


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), default="Data Structures")
    topic_name = Column(String(100), nullable=False)
    correct_count = Column(Integer, default=0)
    attempted_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    mastery_percentage = Column(Float, default=0.0)
    status = Column(String(30), default="insufficient-evidence")  # "solid", "needs-attention", "insufficient-evidence"
    severity = Column(Float, default=0.0)
    urgency = Column(Float, default=0.0)
    priority_score = Column(Float, default=0.0)
    recommended_action = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="mastery")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), default="Data Structures")
    exam_date = Column(String(50), nullable=True)
    days_remaining = Column(Integer, default=14)
    daily_study_hours = Column(Float, default=2.0)
    total_allocated_minutes = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="active")  # "active", "archived"

    user = relationship("User", back_populates="study_plans")
    sessions = relationship("StudySession", back_populates="plan", cascade="all, delete-orphan")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(20), nullable=False)  # "YYYY-MM-DD"
    day_number = Column(Integer, default=1)
    subject = Column(String(100), default="Data Structures")
    topic = Column(String(100), nullable=False)
    activity = Column(String(100), nullable=False)  # "Concept learning", "Active recall", "Practice problems", etc.
    duration_minutes = Column(Integer, default=45)
    priority = Column(String(20), default="High")  # "Critical", "High", "Medium", "Low"
    objective = Column(Text, nullable=False)
    status = Column(String(30), default="pending")  # "pending", "completed", "missed"
    reflection = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    plan = relationship("StudyPlan", back_populates="sessions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(100), nullable=False)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    details_json = Column(Text, default="[]")
    completed_at = Column(DateTime, default=datetime.utcnow)


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(36), ForeignKey("study_sessions.id", ondelete="SET NULL"), nullable=True)
    topic = Column(String(100), nullable=False)
    activity = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, default=0)
    reflection = Column(Text, nullable=True)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    agent_name = Column(String(50), nullable=False)  # "OrchestratorAgent", "MaterialAnalyzerAgent", etc.
    action = Column(String(100), nullable=False)
    detail = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="events")


class QuestionReport(Base):
    __tablename__ = "question_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    question_id = Column(String(36), nullable=False)
    topic = Column(String(100), nullable=False)
    reason = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String(30), default="pending")  # "pending", "reviewed", "resolved"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")
