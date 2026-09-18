# StudyGapRadar — Comprehensive API Contract

This document provides the formal contract specification between the React frontend client and the Python FastAPI backend service (`http://localhost:8000`).

---

## Authentication & Headers
All authenticated endpoints require an `Authorization` header containing the JWT Bearer token:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## API Contract Specification Table

| Frontend Action | HTTP Method | Endpoint | Request Body | Response Body | Frontend Consumer |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Student Registration** | `POST` | `/api/auth/signup` | `{"name": "...", "email": "...", "password": "..."}` | `{"access_token": "...", "token_type": "bearer", "user": {...}}` | `src/context/AuthContext.tsx`, `src/pages/SignUp.tsx` |
| **Student Login** | `POST` | `/api/auth/login` | `{"email": "...", "password": "..."}` | `{"access_token": "...", "token_type": "bearer", "user": {...}}` | `src/context/AuthContext.tsx`, `src/pages/SignIn.tsx` |
| **Get Current Student** | `GET` | `/api/auth/me` | None | `{"id": "...", "name": "...", "email": "...", "branch": "...", "semester": "...", "exam_goal": "...", "subject": "..."}` | `src/context/AuthContext.tsx` |
| **Get Student Profile** | `GET` | `/api/profile` | None | `{"success": true, "data": {"user_id": "...", "branch": "...", "semester": "...", "subject": "...", "exam_name": "...", "exam_date": "...", "daily_study_hours": 2.0, "current_confidence": "...", "learning_goal": "..."}}` | `src/pages/Profile.tsx` |
| **Update Student Profile** | `PUT` | `/api/profile` | `{"branch": "...", "semester": "...", "subject": "...", "exam_name": "...", "exam_date": "...", "daily_study_hours": 2.0, "current_confidence": "...", "learning_goal": "..."}` | `{"success": true, "message": "Profile updated", "data": {...}}` | `src/pages/Onboarding.tsx`, `src/pages/Profile.tsx` |
| **Upload Course PDF** | `POST` | `/api/materials/upload` | `multipart/form-data` (`file: PDF`) | `{"success": true, "message": "...", "data": {"material_id": "...", "summary": "...", "total_chunks": 4, "topics": [...]}}` | `src/pages/AITools.tsx` |
| **Ingest Text Notes** | `POST` | `/api/materials/text` | `{"filename": "...", "text": "..."}` | `{"success": true, "message": "...", "data": {"material_id": "...", "summary": "...", "total_chunks": 2, "topics": [...]}}` | `src/pages/AITools.tsx` |
| **List Ingested Materials** | `GET` | `/api/materials` | None | `[{"id": "...", "filename": "...", "file_type": "...", "summary": "...", "topics": [...], "total_chunks": 3, "created_at": "..."}]` | `src/pages/AITools.tsx`, `src/pages/Preparation.tsx` |
| **Generate Diagnostic Test** | `POST` | `/api/diagnostic/generate` | `{"subject_name": "Data Structures", "topics": ["Trees", "Arrays"], "exam_date": "2026-10-25"}` | `{"success": true, "data": {"attempt_id": "...", "subject": "...", "questions": [{"id": "...", "topic": "...", "prompt": "...", "options": [...], "correct_index": 1, "explanation": "..."}]}}` | `src/pages/DiagnosticSetup.tsx` |
| **Submit Diagnostic Answers** | `POST` | `/api/diagnostic/submit` | `{"attempt_id": "...", "answers": [{"question_id": "...", "selected_index": 0}]}` | `{"success": true, "data": {"attempt_id": "...", "score": 7, "total_questions": 16, "topics": [{"topic": "Trees", "correct": 0, "total": 4, "status": "needs-attention", "priority_score": 0.815, "answers": [...]}]}}` | `src/pages/Diagnostic.tsx` |
| **Get Knowledge Gap Results** | `GET` | `/api/knowledge/results` | None | `{"success": true, "data": {"subject": "...", "exam_date": "...", "overall_mastery": 43.8, "strengths": [...], "weaknesses": [...], "topics": [{"topic": "...", "correct": 0, "total": 4, "status": "...", "severity": 1.0, "urgency": 0.38, "priority_score": 0.815, "answers": [...]}]}}` | `src/pages/Results.tsx`, `src/pages/Home.tsx`, `src/pages/Preparation.tsx` |
| **Generate Study Plan** | `POST` | `/api/plan/generate` | `{"subject": "Data Structures", "exam_date": "2026-10-25", "daily_study_hours": 2.0}` | `{"success": true, "data": {"id": "...", "subject": "...", "days_remaining": 37, "sessions": [{"id": "...", "day_number": 1, "topic": "...", "activity": "...", "duration_minutes": 45, "status": "pending"}]}}` | `src/pages/Onboarding.tsx`, `src/pages/Preparation.tsx` |
| **Get Current Study Plan** | `GET` | `/api/plan` | None | `{"success": true, "data": {"id": "...", "subject": "...", "days_remaining": 37, "daily_study_hours": 2.0, "sessions": [...]}}` | `src/pages/Preparation.tsx`, `src/pages/Home.tsx` |
| **Generate Targeted Quiz** | `POST` | `/api/quiz/generate` | `{"topic": "Trees", "count": 4}` | `{"success": true, "data": {"topic": "Trees", "questions": [{"id": "...", "topic": "Trees", "prompt": "...", "options": [...], "correct_index": 2}]}}` | `src/pages/Practice.tsx` |
| **Submit Practice Quiz** | `POST` | `/api/quiz/submit` | `{"topic": "Trees", "answers": [{"question_id": "...", "selected_index": 3}]}` | `{"success": true, "data": {"quiz_id": "...", "topic": "Trees", "score": 0, "total_questions": 4, "percentage": 0.0, "replan_triggered": true, "explanation": "..."}}` | `src/pages/Practice.tsx`, `src/pages/PracticeComplete.tsx` |
| **Ask Notes-Aware AI Tutor** | `POST` | `/api/tutor/ask` | `{"question": "Explain binary tree traversal", "topic": "Trees", "mode": "explain_simply"}` | `{"success": true, "data": {"answer": "...", "topic": "Trees", "mode": "...", "cites_notes": true, "citations": [...]}}` | `src/pages/AITools.tsx`, `src/pages/Preparation.tsx` |
| **Complete Study Session** | `POST` | `/api/progress/session` | `{"session_id": "...", "duration_minutes": 45, "reflection": "..."}` | `{"success": true, "message": "Session completed", "data": {"session_id": "...", "status": "completed", "daily_streak": 4}}` | `src/pages/Home.tsx`, `src/pages/Preparation.tsx` |
| **Adaptive Replanning** | `POST` | `/api/plan/replan` | `{"reason": "quiz_low_score", "topic": "Trees", "quiz_score": 0.0}` | `{"success": true, "data": {"plan": {...}, "explanation": "..."}}` | `backend/agents/replanning_agent.py` |
| **Live Dashboard Analytics** | `GET` | `/api/analytics/dashboard` | None | `{"success": true, "data": {"user_name": "...", "branch": "...", "semester": "...", "current_mastery": 43.8, "daily_streak": 3, "study_hours_logged": 12.5, "days_remaining": 37, "readiness_indicator": "Needs Immediate Focus", "today_sessions": [...]}}` | `src/pages/Home.tsx` |
| **Autonomous Agent Events** | `GET` | `/api/agents/events` | None | `{"success": true, "data": [{"id": "...", "agent_name": "...", "action": "...", "detail": "...", "timestamp": "..."}]}` | `src/pages/AITools.tsx` |
| **Report Question** | `POST` | `/api/reports/question` | `{"question_id": "...", "reason": "...", "comment": "..."}` | `{"success": true, "message": "Report logged"}` | `src/components/ReportQuestionModal.tsx` |
| **Student Question Reports** | `GET` | `/api/reports/user` | None | `{"success": true, "data": [{"id": "...", "question_id": "...", "reason": "...", "comment": "..."}]}` | `src/pages/Profile.tsx` |
