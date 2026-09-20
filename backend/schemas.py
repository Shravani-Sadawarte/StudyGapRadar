from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Standard API response wrapper
class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    code: Optional[str] = None
    upgrade_required: Optional[bool] = None
    data: Optional[Any] = None

# --- Auth & User ---
class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    plan: str
    ai_questions_used: Optional[int] = 0
    ai_question_limit: Optional[int] = 3
    branch: Optional[str] = ""
    semester: Optional[str] = ""
    exam_goal: Optional[str] = ""
    subject: Optional[str] = "Data Structures"

# --- Profile ---
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    subject: Optional[str] = None
    exam_name: Optional[str] = None
    exam_date: Optional[str] = None
    daily_study_hours: Optional[float] = None
    current_confidence: Optional[str] = None
    learning_goal: Optional[str] = None
    preferred_learning_style: Optional[str] = None

class ProfileResponse(BaseModel):
    user_id: str
    name: str
    email: str
    plan: str
    ai_questions_used: Optional[int] = 0
    ai_question_limit: Optional[int] = 3
    branch: str
    semester: str
    subject: str
    exam_name: str
    exam_date: Optional[str]
    daily_study_hours: float
    current_confidence: str
    learning_goal: str
    preferred_learning_style: str

# --- Material Ingestion ---
class MaterialTextUploadRequest(BaseModel):
    subject_id: Optional[str] = None
    filename: str = "Pasted Notes"
    text: str

class MaterialResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    summary: Optional[str]
    topics: List[str]
    created_at: datetime

# --- Diagnostic & Assessment ---
class DiagnosticGenerateRequest(BaseModel):
    subject_name: str = "Data Structures"
    topics: List[str] = ["Recursion", "Arrays", "Trees"]
    exam_date: Optional[str] = None

class QuestionSchema(BaseModel):
    id: str
    topic: str
    prompt: str
    options: List[str]
    correct_index: Optional[int] = None  # Hidden during test, shown in review
    explanation: Optional[str] = None
    difficulty: Optional[str] = "medium"

class AnswerSubmit(BaseModel):
    question_id: str
    selected_index: Optional[int] = None  # None = skipped

class DiagnosticSubmitRequest(BaseModel):
    attempt_id: str
    answers: List[AnswerSubmit]

class TopicEvidenceAnswer(BaseModel):
    question_id: str
    prompt: str
    options: List[str]
    selected_index: Optional[int]
    correct_index: int
    status: str  # "correct", "incorrect", "unattempted"
    explanation: str

class TopicResultSchema(BaseModel):
    topic: str
    correct: int
    attempted: int
    total: int
    status: str  # "solid", "needs-attention", "insufficient-evidence"
    mastery_percentage: float
    severity: float
    urgency: float
    priority_score: float
    recommended_action: Optional[str] = None
    answers: List[TopicEvidenceAnswer] = []

class KnowledgeResultsResponse(BaseModel):
    subject: str
    exam_date: Optional[str]
    topics: List[TopicResultSchema]
    overall_mastery: float
    strengths: List[str]
    weaknesses: List[str]
    priority_topics: List[Dict[str, Any]]
    created_at: str

# --- Study Plan & Replanning ---
class StudyPlanGenerateRequest(BaseModel):
    subject: str = "Data Structures"
    exam_date: Optional[str] = None
    daily_study_hours: Optional[float] = 2.0

class StudySessionSchema(BaseModel):
    id: str
    date: str
    day_number: int
    subject: str
    topic: str
    activity: str
    duration_minutes: int
    priority: str
    objective: str
    status: str
    reflection: Optional[str] = None

class StudyPlanResponse(BaseModel):
    id: str
    subject: str
    exam_date: Optional[str]
    days_remaining: int
    daily_study_hours: float
    total_allocated_minutes: int
    sessions: List[StudySessionSchema]
    status: str

class ReplanRequest(BaseModel):
    reason: str  # e.g., "poor_quiz_performance", "missed_session", "exam_date_change"
    topic: Optional[str] = None
    quiz_score: Optional[float] = None
    notes: Optional[str] = None

class ReplanResponse(BaseModel):
    plan: StudyPlanResponse
    explanation: str

# --- Quiz ---
class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"

class QuizSubmitRequest(BaseModel):
    topic: str
    answers: List[AnswerSubmit]

class QuizResultResponse(BaseModel):
    topic: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    replan_triggered: bool
    feedback: str

# --- AI Tutor ---
class TutorAskRequest(BaseModel):
    question: str
    topic: Optional[str] = None
    mode: Optional[str] = "explain_simply"  # "explain_simply", "exam_mode", "socratic", "deep_dive"

class TutorResponse(BaseModel):
    answer: str
    topic: str
    cites_notes: bool
    notes_excerpt: Optional[str] = None
    related_topics: List[str] = []
    suggested_practice: Optional[str] = None

# --- Progress & Tracking ---
class SessionCompleteRequest(BaseModel):
    session_id: str
    duration_minutes: Optional[int] = None
    reflection: Optional[str] = None

class ProgressSummaryResponse(BaseModel):
    total_minutes_studied: int
    sessions_completed: int
    sessions_planned: int
    streak_days: int
    recent_sessions: List[Dict[str, Any]]

# --- Question Report ---
class QuestionReportRequest(BaseModel):
    question_id: str
    topic: str
    reason: str
    note: Optional[str] = None

# --- Dashboard & Analytics ---
class DashboardResponse(BaseModel):
    user_name: str
    subject: str
    semester: str
    branch: str
    exam_name: str
    exam_date: Optional[str]
    days_remaining: int
    current_mastery: float
    streak_days: int
    minutes_planned_today: int
    minutes_completed_today: int
    today_sessions: List[StudySessionSchema]
    weak_topics: List[str]
    strong_topics: List[str]
    recommended_next_action: str
    readiness_indicator: str

# --- Agent Events ---
class AgentEventSchema(BaseModel):
    id: str
    agent_name: str
    action: str
    detail: str
    created_at: datetime
