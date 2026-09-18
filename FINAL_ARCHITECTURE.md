# StudyGapRadar — Final Architecture Specification

## 1. System Overview

StudyGapRadar is an autonomous multi-agent academic intelligence and study prioritization platform designed for university engineering students. It synthesizes course curriculum materials via modern PyMuPDF, executes evidence-based diagnostic tests, identifies concept knowledge gaps using weighted priority mathematics ($70\% \text{ severity} + 30\% \text{ urgency}$), builds adaptive daily study calendars, and continuously realigns study schedules via dynamic replanning when practice quiz scores indicate performance drift.

The visual interface is built upon the **original Bolt design system** (React 18 + Tailwind CSS), preserved with 100% aesthetic fidelity and powered by a high-performance **Python FastAPI** backend service.

---

## 2. Architectural Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                         |
|                                React 18 + Vite SPA                                      |
|                               http://localhost:5173                                     |
|                                                                                         |
|   Landing (/)          SignIn (/signin)       SignUp (/signup)     Onboarding (/onboarding) |
|   Dashboard (/home)    Preparation (/prep)    Results (/results)   Diagnostic (/diagnostic) |
|   Practice (/practice) AI Tools (/ai-tools)   Profile (/profile)   Premium (/premium)       |
+-----------------------------------------------------------------------------------------+
                                             │
                                    REST API (JSON / JWT)
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                    BACKEND LAYER                                        |
|                              FastAPI Python 3.13 ASGI                                   |
|                               http://localhost:8000                                     |
|                                                                                         |
|   ┌─────────────────────────────────────────────────────────────────────────────────┐   |
|   │ 12 API Routers:                                                                 │   |
|   │ /api/auth       /api/profile     /api/materials   /api/diagnostic               │   |
|   │ /api/knowledge  /api/plan        /api/quiz        /api/tutor                    │   |
|   │ /api/progress   /api/analytics   /api/agents      /api/reports                  │   |
|   └─────────────────────────────────────────────────────────────────────────────────┘   |
|                                             │                                           |
|                     ┌───────────────────────┴───────────────────────┐                   |
|                     ▼                                               ▼                   |
|   ┌───────────────────────────────────┐           ┌─────────────────────────────────┐   |
|   │     8 Autonomous Agent System     │           │       Core Services Engine      │   |
|   │                                   │           │                                 │   |
|   │ 1. OrchestratorAgent (Lifecycle)  │           │ - pdf_service (PyMuPDF parser)  │   |
|   │ 2. MaterialAnalyzerAgent (Chunks) │           │ - retrieval_service (TF-IDF RAG)│   |
|   │ 3. AssessmentAgent (Questions)    │           │ - material_service (Catalog)    │   |
|   │ 4. KnowledgeAgent (Gap Scoring)   │           │ - assessment_service (Bank)     │   |
|   │ 5. PlanningAgent (Scheduler)      │           │ - planning_service (Calendar)   │   |
|   │ 6. TutorAgent (Context Retrieval) │           │ - progress_service (Analytics)  │   |
|   │ 7. ProgressAgent (Streaks/Metrics)│           └─────────────────────────────────┘   |
|   │ 8. ReplanningAgent (Adaptation)   │                                                 |
|   └───────────────────────────────────┘                                                 |
+-----------------------------------------------------------------------------------------+
                                             │
                                  SQLAlchemy 2.0 ORM
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                  PERSISTENCE LAYER                                      |
|                         SQLite 3 Database (studygapradar.db)                            |
|                          WAL Mode - 14 Relational Entities                              |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Autonomous Multi-Agent Collaboration Loop

The agents collaborate continuously following an auditable closed-loop control system:

```
                  ┌─────────────────────────────────────┐
                  │          1. OBSERVE PHASE           │
                  │  MaterialAnalyzer: PDF Ingestion    │
                  │  AssessmentAgent: Question Curation │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          2. ANALYZE PHASE           │
                  │  KnowledgeAgent: Evaluates Mastery  │
                  │  Severity & Urgency Calculation     │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │           3. PLAN PHASE             │
                  │  PlanningAgent: Allocates Calendar  │
                  │  Sessions based on Exam Timeline    │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │            4. ACT PHASE             │
                  │  Student studies on Dashboard/Prep  │
                  │  TutorAgent provides Notes RAG      │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          5. EVALUATE PHASE          │
                  │  Student takes Targeted Topic Quiz  │
                  │  ProgressAgent computes Score Drift │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │           6. ADAPT PHASE            │
                  │  ReplanningAgent detects Gap Drift  │
                  │  Restructures Calendar Sessions     │
                  └──────────────────┬──────────────────┘
                                     │
                                     └───────► (Re-enters ACT)
```

---

## 4. Frontend Route Architecture & Page Contracts

| Route | Page Component | Primary Capabilities & Data Binding |
| :--- | :--- | :--- |
| `/` | `Landing.tsx` | Hero introduction, feature highlights, value proposition, CTA links. |
| `/signin` | `SignIn.tsx` | Authenticates existing student via `/api/auth/login`, saves JWT. |
| `/signup` | `SignUp.tsx` | Registers student via `/api/auth/signup` and sets session token. |
| `/onboarding` | `Onboarding.tsx` | Configures branch, semester, target exam date, and generates plan. |
| `/home` | `Home.tsx` | Dashboard displaying study streaks, today's tasks, and progress summary. |
| `/prep` | `Preparation.tsx` | Dedicated study preparation hub: next session, today's schedule, materials. |
| `/diagnostic/setup` | `DiagnosticSetup.tsx` | Syllabus topic selector and exam date configuration for diagnostic. |
| `/diagnostic` | `Diagnostic.tsx` | Interactive test engine with timer, feedback, and question queues. |
| `/results` | `Results.tsx` | Comprehensive diagnostic results: scores, topic meters, evidence, next steps. |
| `/practice` | `Practice.tsx` | Targeted topic quiz generator powered by `/api/quiz/generate`. |
| `/practice/complete` | `PracticeComplete.tsx` | Displays quiz score, percent, and adaptive replanning notification. |
| `/ai-tools` | `AITools.tsx` | PyMuPDF document upload, text notes ingestion, AI Tutor, and agent audit stream. |
| `/profile` | `Profile.tsx` | Student academic settings, onboarding goals, and question issue reports. |
| `/premium` | `Premium.tsx` | Premium capabilities and advanced AI study feature preview. |

---

## 5. Security & Configuration Architecture

- **Zero Client Exposure of API Keys**: The `OPENAI_API_KEY` is strictly managed server-side inside `backend/config.py`. It is never delivered to the client bundle or browser memory.
- **Robust Offline/No-Key Fallback**: When `OPENAI_API_KEY` is not provided or offline, the TutorAgent seamlessly defaults to the built-in domain pedagogical knowledge engine without interrupting user workflows.
- **Authentication**: Tokens are signed using HMAC-SHA256 with user ID payloads and verified per-request via FastAPI's `Depends(get_current_user)`.
- **Database Concurrency**: The SQLite engine is initialized with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) and standard connection timeouts to guarantee seamless concurrent reads and writes.
