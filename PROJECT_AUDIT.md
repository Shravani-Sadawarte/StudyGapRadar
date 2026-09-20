# StudyGapRadar — Comprehensive Project Audit

> **Audit Date:** September 18, 2026  
> **Source:** Bolt-imported repository (`project-bolt-sb1-78ckjmr7`)  
> **Application Name:** StudyGapRadar  
> **Core Value Proposition:** *"Detects what you don't know — before your exam does."* Evidence-based diagnostic and study prioritization platform for engineering students.

---

## 1. Executive Summary & Current Architecture

StudyGapRadar is currently a **100% client-side React Single Page Application (SPA)**. It was scaffolded using Vite and styled with Tailwind CSS. 

At present:
- **Zero backend services exist.** There is no server process, no active API layer, and no database connection.
- **Persistence is purely browser-local.** All user accounts, sessions, diagnostic state, answers, test results, and question reports are serialized to `localStorage`.
- **Logic is deterministic and client-side.** Scoring calculations, severity thresholds, exam urgency weighting, and priority sorting are executed synchronously in the user's browser.
- **AI capabilities are conceptual/mock-only.** Promotional cards and locked feature previews exist, but no LLM or AI integration is currently connected.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER RUNTIME                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     React Router v6 SPA                        │   │
│   │   Landing │ Auth │ Onboarding │ Home │ Diagnostic │ Results    │   │
│   │   Practice │ Profile │ AI Tools │ Premium                      │   │
│   └──────────────────────┬──────────────────────┬──────────────────┘   │
│                          │                      │                      │
│                          ▼                      ▼                      │
│         ┌───────────────────────────┐  ┌───────────────────────────┐   │
│         │     AuthContext.tsx       │  │   scoring.ts / Logic      │   │
│         │ (Mock Auth, Demo Session) │  │  (70% Sev + 30% Urgency)  │   │
│         └──────────────┬────────────┘  └─────────────┬─────────────┘   │
│                        │                             │                 │
│                        ▼                             ▼                 │
│         ┌──────────────────────────────────────────────────────────┐   │
│         │              src/lib/storage.ts Helper                   │   │
│         │            (Window.localStorage Adapter)                │   │
│         └──────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │              localStorage Keys (Local Browser Only)            │   │
│   │  sgr.credentials  │  sgr.user  │  sgr.diagnosticState           │   │
│   │  sgr.results      │  sgr.practice │  sgr.reports               │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                         [NO BACKEND / NO DATABASE]
                                    │
                                    ▼
                         (External Sync: None)
```

---

## 2. Technology Stack & Dependencies

### Frontend Framework & Core Libraries
- **Framework:** React 18.3.1
- **Runtime / DOM:** `react-dom` 18.3.1
- **Language:** TypeScript 5.5.3 (Target: ES2020)
- **Routing:** `react-router-dom` 6.30.4
- **Iconography:** `lucide-react` 0.446.0

### Build & Styling Tooling
- **Bundler & Dev Server:** Vite 5.4.2 (`@vitejs/plugin-react` 4.3.1)
- **CSS Framework:** Tailwind CSS 3.4.1
- **PostCSS:** PostCSS 8.4.35 + Autoprefixer 10.4.18
- **Linter:** ESLint 9.9.1 (Flat config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
- **Typography:** Google Fonts (`Inter` 400-700 & `Plus Jakarta Sans` 500-800) loaded via `index.html`

### Installed Packages Analysis (`package.json`)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "lucide-react": "^0.446.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```
> **Key Finding:** `@supabase/supabase-js` is installed in `dependencies`, but **nowhere in `src/` is it imported, configured, or called**.

---

## 3. Frontend Routes & Navigation Flow

The routing table is declared in `src/App.tsx` using two route guards:
1. **`RequireAuth`**: Checks `isAuthenticated` (`!!user` in `AuthContext`). If false, redirects to `/signin` with route state.
2. **`RequireOnboarding`**: Checks whether `user.branch`, `user.semester`, and `user.examGoal` are populated. If any are missing, redirects to `/onboarding`.

| Path | Component | Guard Level | Purpose / Description |
|---|---|---|---|
| `/` | `Landing.tsx` | Public | Hero banner, value proposition, "Start Your Preparation" CTA, "Try Demo" 1-click test driver, feature highlights. |
| `/signup` | `SignUp.tsx` | Public | Name, email, password, and confirm password fields. Writes plaintext credentials to `localStorage.sgr.credentials` and transitions to `/onboarding`. |
| `/signin` | `SignIn.tsx` | Public | Validates email/password against `localStorage.sgr.credentials`. Includes quick "Continue with Demo Account" button. Redirects to `/home`. |
| `/onboarding` | `Onboarding.tsx` | `RequireAuth` | 3-step configuration wizard: Engineering branch selection, current semester, exam preparation goal. |
| `/home` | `Home.tsx` | `RequireAuth` + `RequireOnboarding` | Student dashboard: greeting, primary diagnostic CTA, active preparation card, 4-stat session summary, recommended next action, preview of latest test. |
| `/diagnostic/setup` | `DiagnosticSetup.tsx` | `RequireAuth` + `RequireOnboarding` | Configures a diagnostic test: selects subject (Data Structures), topic checkboxes, optional exam date picker. Generates question queue. |
| `/diagnostic` | `Diagnostic.tsx` | `RequireAuth` + `RequireOnboarding` | Linear test runner: 4 questions per selected topic. Option selection, instantaneous feedback and explanation locking, skip question, report modal. |
| `/results` | `Results.tsx` | `RequireAuth` + `RequireOnboarding` | Diagnostic breakdown: Solid / Needs Attention / Insufficient Evidence tags, "What to Revise First" priority ranking, full evidence accordion. |
| `/practice` | `Practice.tsx` | `RequireAuth` + `RequireOnboarding` | Targeted practice module for weak topics (defaults to Recursion). Immediate answer verification, progress bar, report modal. |
| `/practice/complete` | `PracticeComplete.tsx` | `RequireAuth` + `RequireOnboarding` | Score screen for completed practice test with revision guidance and next steps. |
| `/profile` | `Profile.tsx` | `RequireAuth` + `RequireOnboarding` | View and edit user details (name, branch, semester, goal), view subscription plan, inspect user-submitted question reports, sign out. |
| `/ai-tools` | `AITools.tsx` | `RequireAuth` + `RequireOnboarding` | Presentation of Free vs Premium tiers, AI feature previews (Question Generation, Variant/Difficulty classification, Note Upload). |
| `/premium` | `Premium.tsx` | `RequireAuth` + `RequireOnboarding` | Feature comparison for Premium upgrade. Allows immediate 1-click simulated upgrade (sets `user.plan = 'premium'`). |
| `*` | Wildcard | Public | Redirects invalid routes to `/`. |

---

## 4. Component Structure & Hierarchy

```
src/
├── main.tsx                         # Entry point (StrictMode, render root)
├── App.tsx                          # Router, route guards (RequireAuth, RequireOnboarding)
├── index.css                        # Tailwind directives and utility classes (.btn, .card, .badge, .input)
├── components/
│   ├── AppNav.tsx                   # Top navigation bar (desktop) + bottom tab bar (mobile)
│   │   └── AppShell                 # Master layout wrapper (AppNav + max-w-6xl container)
│   ├── Logo.tsx                     # Logo icon & Wordmark component
│   └── ReportQuestionModal.tsx      # Accessible dialog to flag errors in questions
├── context/
│   └── AuthContext.tsx              # React Context providing user, auth actions, demo seed
├── lib/
│   ├── types.ts                     # TypeScript interfaces (UserProfile, Question, TopicResult, etc.)
│   ├── storage.ts                   # localStorage CRUD wrapper
│   ├── scoring.ts                   # Deterministic scoring, thresholds, priority rank formula
│   └── mockData.ts                  # Static question bank, subjects, branches, semesters, goals
└── pages/
    ├── Landing.tsx
    ├── SignUp.tsx                   # Contains exported AuthLayout and Field components
    ├── SignIn.tsx
    ├── Onboarding.tsx
    ├── Home.tsx
    ├── DiagnosticSetup.tsx
    ├── Diagnostic.tsx
    ├── Results.tsx
    ├── Practice.tsx
    ├── PracticeComplete.tsx
    ├── Profile.tsx
    ├── AITools.tsx
    └── Premium.tsx
```

### Shared / Reusable Components
1. **`AppNav` / `AppShell` (`src/components/AppNav.tsx`)**:
   - Desktop top bar with logo, links (`Home`, `Diagnose`, `Practice`, `AI Study Tools`, `Profile`), plan badge (`Premium` / `Free Plan`), and `Sign out`.
   - Mobile bottom bar pinned to screen footer with safe-area padding.
   - `AppShell` wraps page contents in standard padding and background.
2. **`Logo` / `Wordmark` (`src/components/Logo.tsx`)**:
   - Configurable radar icon (`sm`, `md`, `lg`) and styled brand text.
3. **`ReportQuestionModal` (`src/components/ReportQuestionModal.tsx`)**:
   - Modal popup supporting 5 flag reasons (`Incorrect answer`, `Ambiguous`, `Wrong topic`, `Difficulty seems wrong`, `Other`), optional text note, submission confirmation. Reused across `Diagnostic.tsx` and `Practice.tsx`.
4. **`AuthLayout` & `Field` (`src/pages/SignUp.tsx`)**:
   - Reusable split-screen branded layout with decorative background blurs.
   - Reusable form field component with integrated error messaging. Reused by `SignIn.tsx`.

---

## 5. Existing Authentication Implementation

- **Mechanism:** Completely mocked inside `src/context/AuthContext.tsx`.
- **Storage Keys:**
  - `sgr.credentials`: Array of `{ name, email, password }` objects stored as JSON string.
  - `sgr.user`: Active session `{ name, email, branch, semester, examGoal, plan }`.
- **Security Posture:**
  - Passwords are stored in **raw plaintext** in browser `localStorage`.
  - No hashing (no bcrypt/argon2), no salt.
  - No authentication tokens (no JWTs, bearer tokens, or HTTP-only cookies).
  - No expiry, refresh cycle, or session invalidation on server.
- **Demo Mode:**
  - `signInDemo()` triggers auto-login as `Aarav Sharma` (`demo@studygapradar.app`).
  - Pre-seeds realistic diagnostic results (`Recursion` needs-attention, `Arrays` solid, `Trees` insufficient-evidence) via `demoResults()` in `scoring.ts`.
- **Sign Out:**
  - Resets React state to `null` and invokes `storage.clearAll()`, which removes all `sgr.*` items from `localStorage`.

---

## 6. Current Data Flow & Storage Mechanism

Data operations are synchronous and centralized in `src/lib/storage.ts`:

| Key Name | TypeScript Type | Read By | Written By | Description |
|---|---|---|---|---|
| `sgr.user` | `UserProfile` | `AuthContext` | `AuthContext` | Current user profile, academic metadata, and subscription plan (`free` vs `premium`). |
| `sgr.credentials` | `StoredCred[]` | `AuthContext` | `AuthContext` | Mock credentials database table. |
| `sgr.diagnosticState` | `DiagnosticState` | `DiagnosticSetup`, `Diagnostic` | `DiagnosticSetup`, `Diagnostic` | In-progress test session, active topic queue, submitted answers, current index. |
| `sgr.results` | `DiagnosticResult` | `Home`, `Results`, `Practice`, `AITools` | `Diagnostic`, `AuthContext` (demo seed) | Final scored result of latest diagnostic test. |
| `sgr.practice` | `PracticeAnswer[]` | `Practice`, `PracticeComplete` | `Practice` | History of answers in current targeted practice run. |
| `sgr.reports` | `ReportEntry[]` | `Profile` | `Diagnostic`, `Practice` | Log of question issues flagged by user. |

---

## 7. Mock / Static Data Inventory

All mock data is organized in `src/lib/mockData.ts`:

1. **Subjects & Topics (`SUBJECTS`)**:
   - Subject: `Data Structures`
   - Configured Topics: `Recursion`, `Arrays`, `Trees`, `Linked Lists`
   - Default Selected Topics: `['Recursion', 'Arrays', 'Trees']`
2. **Diagnostic Questions (`DIAGNOSTIC_QUESTIONS`)**:
   - Total Questions: **12** (4 per topic)
   - Topics with questions: `Recursion` (4), `Arrays` (4), `Trees` (4)
   - *Note:* `Linked Lists` has **0 questions** defined.
3. **Practice Questions (`PRACTICE_QUESTIONS`)**:
   - Total Questions: **5**
   - Topic: `Recursion` only.
4. **Academic Classifications**:
   - `BRANCHES`: 6 engineering branches (CSE, ME, ECE, CE, EE, IT).
   - `SEMESTERS`: 6 semesters (Semester 3 through Semester 8).
   - `EXAM_GOALS`: 3 goals (Semester Exams, Midterms, Internal Assessment).
5. **Pre-Seeded Demo Results (`demoResults()` in `scoring.ts`)**:
   - `Recursion`: 2/4 correct (50%) -> status: `needs-attention`
   - `Arrays`: 4/4 correct (100%) -> status: `solid`
   - `Trees`: 1 attempted, 1/4 correct (25%) -> status: `insufficient-evidence`

---

## 8. Existing API Calls

- **Total API Calls in Project:** `0`
- No `fetch`, `axios`, `XMLHttpRequest`, WebSockets, or `@supabase/supabase-js` instances exist in the code.

---

## 9. Existing Charts, Metrics & Analytics

The project does not include any third-party charting libraries (such as Chart.js, Recharts, or ApexCharts). Visual metrics are rendered natively using Tailwind CSS:

1. **Radar Animation:** Hero banner in `Landing.tsx` uses custom CSS keyframe `radar-ping` (`scale(0.8)` to `scale(2.4)`).
2. **Linear Progress Bars:**
   - Question progress bars in `Diagnostic.tsx` and `Practice.tsx` with dynamic inline CSS percentage widths.
   - Severity and Exam Urgency bars in `Results.tsx` (`WeightBar`).
3. **Question Status Dot Trackers:**
   - Color-coded dot trackers at the bottom of diagnostic and practice sessions (Green = Correct, Red = Incorrect, Gray = Unattempted / In-Progress).
4. **Diagnostic Metrics:**
   - Topic status classification:
     - `Solid` (`>= 75%` accuracy and at least 4 attempted).
     - `Needs Attention` (`< 75%` accuracy and at least 4 attempted).
     - `Insufficient Evidence` (`< 4` attempted or fewer than total questions).
5. **Study Priority Algorithm (`priorityScore` in `src/lib/scoring.ts`)**:
   $$\text{Priority Score} = 0.7 \times \text{Severity} + 0.3 \times \text{Urgency}$$
   - **Severity:** $1 - \left(\frac{\text{Correct}}{\text{Attempted}}\right)$ for weak topics.
   - **Urgency:** If exam date is provided, calculates days remaining $d$:
     $$\text{Urgency} = \max\left(0, 1 - \frac{d}{60}\right)$$
     (where exam today = 1.0, and 60+ days away = 0). If no exam date, urgency = 0.

---

## 10. Existing File Upload Functionality

- **Implementation Status:** None.
- In `src/pages/AITools.tsx`, there is a UI card showcasing *"AI Notes / Document Understanding"*. It renders an area with a dashed border, a lock icon, and a label *"Upload Study Notes"*, marked with a badge *"Coming Soon"*.
- There is no `<input type="file">`, no drag-and-drop handler, and no client-side file reader (e.g. `FileReader`) anywhere in the code.

---

## 11. Existing Diagnostic & Testing Functionality

1. **Setup Phase (`DiagnosticSetup.tsx`)**:
   - User picks topics from subject.
   - Optional date picker with validation (`min={today}`).
   - Assembles an array of questions filtered from `DIAGNOSTIC_QUESTIONS`.
   - Saves initial session state to `localStorage.sgr.diagnosticState`.
2. **Assessment Phase (`Diagnostic.tsx`)**:
   - Reads active question queue and current index.
   - Displays multiple-choice options (A, B, C, D).
   - "Submit Answer" button locks option, compares against `question.correctIndex`, and reveals immediate green/red feedback with an explanation.
   - "Skip" button records question status as `unattempted`.
   - "Report a Question" button allows submitting error reports via `ReportQuestionModal`.
3. **Completion & Calculation Phase**:
   - When queue completes, calculates `TopicResult` for each topic:
     - Aggregates `correct`, `attempted`, and `total`.
     - Assigns status via `computeStatus()`.
   - Writes `DiagnosticResult` to `localStorage.sgr.results`.
   - Clears `sgr.diagnosticState`.
   - Transitions to `/results`.

---

## 12. Existing Study-Plan & Revision Functionality

1. **Prioritization Engine (`Results.tsx`)**:
   - Filters topics having status `needs-attention`.
   - Computes severity and urgency weights, ranking weak topics in order of priority.
   - Clear fallback message if no exam date is set: *"Exam timeline unavailable — priority based on topic performance only."*
2. **Targeted Practice Handoff (`Practice.tsx`)**:
   - Inspects `sgr.results` and chooses the first `needs-attention` topic (defaults to `Recursion` if none found).
   - Presents questions sequentially from `PRACTICE_QUESTIONS`.
3. **Post-Practice Action (`PracticeComplete.tsx`)**:
   - Displays final score.
   - Shows static revision guidance text: *"Review the concepts associated with [Topic] that were identified as needing attention."*
   - Clears practice session and navigates back to `/results`.
4. **Limitations:**
   - No multi-day schedule, study calendar, spaced repetition interval tracker, or revision timeline exists.

---

## 13. Existing AI & Tutor Functionality

- **Implementation Status:** Purely presentational / mock.
- **Preview Features (`AITools.tsx`)**:
  - `AI Question Generation`: Mock preview card with disabled/enabled button based on plan.
  - `AI Question Variation & Difficulty Support`: Informational card.
  - `AI Notes / Document Understanding`: Mock upload container marked "Coming Soon".
- **Product Policy / Boundary Stated in UI**:
  - The application explicitly defines an architectural constraint:
    > *"AI in StudyGapRadar supports content generation and classification. Deterministic product logic — scoring, thresholds, insufficient evidence, severity, exam urgency, and priority ranking — is never handled by AI. No chatbot, no black-box mastery detection."*

---

## 14. Environment Variables

- **Status:** **Zero environment variables are defined or consumed.**
- No `.env`, `.env.example`, `.env.local`, or `.env.production` files exist in the repository.
- There are no calls to `import.meta.env.*` in the source code.

---

## 15. Missing Backend Functionality (Gap Analysis)

To make StudyGapRadar production-ready, the following backend components are missing:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MISSING BACKEND SUBSYSTEMS                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Secure Authentication & Identity                                    │
│    - Password hashing (Argon2 / bcrypt)                                │
│    - JWT token issuance (Access & Refresh tokens) or Session Cookies   │
│    - Password reset & email verification flows                         │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Relational Database & ORM                                           │
│    - Persistent relational storage for Users, Questions, Tests, Scores │
│    - Foreign keys, constraints, audit timestamps                       │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Curriculum & Question Bank Service                                  │
│    - Database-backed subjects, branches, topics, and questions        │
│    - Dynamic filtering by branch and semester                          │
│    - Server-side question randomization and pagination                 │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Server-Side Assessment & Scoring Engine                             │
│    - Secure test sessions (prevent leaking correct answers in payload) │
│    - Server-side validation of answers, scoring, and thresholds        │
│    - Historical diagnostic attempt tracking (progress over time)       │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Targeted Practice & Revision Engine                                 │
│    - Dynamic practice sets generated for ANY weak topic                │
│    - Spaced repetition or multi-day revision schedule generation       │
├────────────────────────────────────────────────────────────────────────┤
│ 6. Moderation & Question Reporting Pipeline                            │
│    - Store reported questions in database with user linkage            │
│    - Admin review workflow                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 7. File Upload & Document Ingestion (for Premium Notes feature)        │
│    - S3 / Supabase Storage bucket for PDF/DOCX uploads                 │
│    - OCR / text extraction pipeline                                    │
├────────────────────────────────────────────────────────────────────────┤
│ 8. Real AI / LLM Integration (for Premium Tools)                       │
│    - Secure LLM API calls (Gemini / Anthropic / OpenAI) via backend    │
│    - Structured JSON output schemas for question generation & tagging  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Required API Endpoints Specification

When the backend is implemented, the frontend will require the following RESTful API endpoints:

### Authentication & User Management
- `POST /api/v1/auth/register` — Register a new student (`name`, `email`, `password`).
- `POST /api/v1/auth/login` — Authenticate student credentials, returns JWT tokens or session cookie.
- `POST /api/v1/auth/logout` — Invalidate user session / revoke refresh token.
- `GET /api/v1/auth/me` — Retrieve current authenticated user session and plan.
- `GET /api/v1/users/profile` — Fetch student profile (branch, semester, exam goal, plan).
- `PATCH /api/v1/users/profile` — Update student profile metadata.
- `POST /api/v1/users/upgrade` — Upgrade account tier to Premium.

### Curriculum & Content
- `GET /api/v1/curriculum/branches` — List supported engineering branches.
- `GET /api/v1/curriculum/subjects?branch=...&semester=...` — Get available subjects for a student's branch and semester.
- `GET /api/v1/curriculum/subjects/:subjectId/topics` — Retrieve topic list for a subject.

### Diagnostic Tests & Assessment
- `POST /api/v1/diagnostics/sessions` — Initiate a diagnostic test session (`subjectId`, `topicIds`, `examDate`). Returns session ID and question queue without exposing `correctIndex` or `explanation`.
- `POST /api/v1/diagnostics/sessions/:sessionId/answers` — Submit an answer for a question. Returns correctness status and explanation.
- `POST /api/v1/diagnostics/sessions/:sessionId/skip` — Mark a question as skipped/unattempted.
- `POST /api/v1/diagnostics/sessions/:sessionId/complete` — Finalize test session; server computes scores, severity, urgency, priority ranks, and persists results.
- `GET /api/v1/diagnostics/results/latest` — Retrieve student's latest diagnostic summary.
- `GET /api/v1/diagnostics/results/:resultId` — Retrieve specific historical diagnostic result and question evidence.

### Targeted Practice
- `POST /api/v1/practice/sessions` — Start practice session for a topic (`topicId` or `topicName`). Returns practice questions.
- `POST /api/v1/practice/sessions/:sessionId/answers` — Submit practice answer.
- `POST /api/v1/practice/sessions/:sessionId/complete` — Finalize practice session and record outcome.

### Reports & Feedback
- `POST /api/v1/reports/questions` — Submit an issue report (`questionId`, `topic`, `reason`, `note`).
- `GET /api/v1/reports/my-reports` — List questions reported by the authenticated student.

### AI Study Tools (Premium)
- `POST /api/v1/ai/generate-questions` — Backend calls LLM to generate practice questions for approved topics.
- `POST /api/v1/ai/question-variants` — Generate question variations and classify difficulty levels.
- `POST /api/v1/ai/upload-notes` — Multipart file upload (PDF/DOCX) for note ingestion and topic parsing.

---

## 17. Required Database Entities & Schema Design

Below is the relational database entity model required to support the entire application:

```
┌─────────────────┐       1:1       ┌──────────────────┐
│      users      ├─────────────────┤  user_profiles   │
│-----------------│                 │------------------│
│ id (PK)         │                 │ user_id (FK)     │
│ email           │                 │ branch           │
│ password_hash   │                 │ semester         │
│ name            │                 │ exam_goal        │
│ plan            │                 └──────────────────┘
└────────┬────────┘
         │ 1:N
         ├─────────────────────────────────────────┐
         │ 1:N                                     │ 1:N
         ▼                                         ▼
┌──────────────────────┐                 ┌────────────────────┐
│ diagnostic_sessions  │                 │ practice_sessions  │
│----------------------│                 │--------------------│
│ id (PK)              │                 │ id (PK)            │
│ user_id (FK)         │                 │ user_id (FK)       │
│ subject_id (FK)      │                 │ topic_id (FK)      │
│ exam_date            │                 │ status             │
│ status               │                 └─────────┬──────────┘
└──────────┬───────────┘                           │ 1:N
           │ 1:N                                   ▼
           ├───────────────────────┐     ┌────────────────────┐
           ▼                       ▼     │  practice_answers  │
┌──────────────────────┐ ┌─────────────┐ │--------------------│
│  diagnostic_answers  │ │topic_results│ │ id (PK)            │
│----------------------│ │-------------│ │ session_id (FK)    │
│ id (PK)              │ │ id (PK)     │ │ question_id (FK)   │
│ session_id (FK)      │ │ session (FK)│ │ selected_index     │
│ question_id (FK)     │ │ topic_id(FK)│ │ status             │
│ selected_index       │ │ correct     │ └────────────────────┘
│ status               │ │ attempted   │
└──────────────────────┘ │ total       │
                         │ status      │
                         │ score       │
                         └─────────────┘
```

### Entity Definitions

1. **`users`**:
   - `id` (UUID, Primary Key)
   - `email` (VARCHAR, Unique, Indexed)
   - `password_hash` (VARCHAR, Nullable if OAuth used)
   - `name` (VARCHAR)
   - `plan` (VARCHAR: `'free'` | `'premium'`, default `'free'`)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`user_profiles`**:
   - `user_id` (UUID, Primary Key, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `branch` (VARCHAR)
   - `semester` (VARCHAR)
   - `exam_goal` (VARCHAR)
   - `updated_at` (TIMESTAMPTZ)

3. **`subjects`**:
   - `id` (UUID, Primary Key)
   - `name` (VARCHAR) — e.g. "Data Structures"
   - `code` (VARCHAR, Optional) — e.g. "CS301"
   - `branch` (VARCHAR, Optional)
   - `semester` (VARCHAR, Optional)

4. **`topics`**:
   - `id` (UUID, Primary Key)
   - `subject_id` (UUID, Foreign Key -> `subjects.id` ON DELETE CASCADE)
   - `name` (VARCHAR) — e.g. "Recursion", "Arrays", "Trees"
   - `order_index` (INTEGER)

5. **`questions`**:
   - `id` (UUID, Primary Key)
   - `topic_id` (UUID, Foreign Key -> `topics.id` ON DELETE CASCADE)
   - `type` (VARCHAR: `'diagnostic'` | `'practice'`)
   - `prompt` (TEXT)
   - `options` (JSONB) — Array of option strings
   - `correct_index` (SMALLINT)
   - `explanation` (TEXT)
   - `difficulty` (VARCHAR, Optional: `'easy'` | `'medium'` | `'hard'`)
   - `is_active` (BOOLEAN, default `true`)

6. **`diagnostic_sessions`**:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `subject_id` (UUID, Foreign Key -> `subjects.id`)
   - `exam_date` (DATE, Nullable)
   - `status` (VARCHAR: `'in_progress'` | `'completed'`, default `'in_progress'`)
   - `created_at`, `completed_at` (TIMESTAMPTZ)

7. **`diagnostic_answers`**:
   - `id` (UUID, Primary Key)
   - `session_id` (UUID, Foreign Key -> `diagnostic_sessions.id` ON DELETE CASCADE)
   - `question_id` (UUID, Foreign Key -> `questions.id`)
   - `selected_index` (SMALLINT, Nullable for unattempted/skipped)
   - `status` (VARCHAR: `'correct'` | `'incorrect'` | `'unattempted'`)
   - `created_at` (TIMESTAMPTZ)

8. **`topic_results`**:
   - `id` (UUID, Primary Key)
   - `session_id` (UUID, Foreign Key -> `diagnostic_sessions.id` ON DELETE CASCADE)
   - `topic_id` (UUID, Foreign Key -> `topics.id`)
   - `correct` (INTEGER)
   - `attempted` (INTEGER)
   - `total` (INTEGER)
   - `status` (VARCHAR: `'solid'` | `'needs-attention'` | `'insufficient-evidence'`)
   - `severity` (NUMERIC)
   - `urgency` (NUMERIC)
   - `priority_score` (NUMERIC)

9. **`practice_sessions` & `practice_answers`**:
   - `practice_sessions`: `id`, `user_id`, `topic_id`, `created_at`, `completed_at`.
   - `practice_answers`: `id`, `session_id`, `question_id`, `selected_index`, `status`, `created_at`.

10. **`question_reports`**:
    - `id` (UUID, Primary Key)
    - `user_id` (UUID, Foreign Key -> `users.id`)
    - `question_id` (UUID, Foreign Key -> `questions.id`)
    - `reason` (VARCHAR)
    - `note` (TEXT, Nullable)
    - `status` (VARCHAR: `'pending'` | `'reviewed'` | `'resolved'`, default `'pending'`)
    - `created_at` (TIMESTAMPTZ)

11. **`study_documents` (Future AI Notes Feature)**:
    - `id` (UUID, Primary Key)
    - `user_id` (UUID, Foreign Key -> `users.id`)
    - `filename` (VARCHAR)
    - `file_url` (TEXT)
    - `status` (VARCHAR: `'uploaded'` | `'processing'` | `'ready'` | `'failed'`)
    - `extracted_summary` (TEXT, Nullable)

---

## 18. Critical Risks, Edge Cases & Structural Conflicts

1. **Mock Data Topic Inconsistency ("Linked Lists" Bug)**:
   - In `src/lib/mockData.ts`, `SUBJECTS[0].topics` defines `['Recursion', 'Arrays', 'Trees', 'Linked Lists']`.
   - However, `DIAGNOSTIC_QUESTIONS` only defines questions for `Recursion`, `Arrays`, and `Trees`.
   - If a user selects `Linked Lists` on `/diagnostic/setup`, 0 questions are enqueued for it. When finishing, `computeStatus(0, 0, 0)` is evaluated, causing an empty test state or unexpected zero-division calculations.
2. **Hardcoded Practice Topic Disconnect**:
   - `PRACTICE_QUESTIONS` in `mockData.ts` **only contains questions for Recursion**.
   - If a student takes a diagnostic and scores poorly in `Arrays` or `Trees`, `Practice.tsx` will display `Arrays` or `Trees` as the title, but **still serve Recursion questions** (`rec-p1` to `rec-p5`).
3. **Question Answer Leakage (Client-Side Cheating)**:
   - Currently, `DIAGNOSTIC_QUESTIONS` embeds `correctIndex` and `explanation` directly in the client bundle. Any student can open Chrome DevTools or inspect localStorage to view the answer key.
4. **Plaintext Password Storage in LocalStorage**:
   - `sgr.credentials` stores user passwords as plain unhashed text. Any script or browser extension running in the origin can read user passwords directly.
5. **Rigid "Insufficient Evidence" Threshold Rule**:
   - In `scoring.ts`, `computeStatus` requires `attempted >= total && attempted >= 4`.
   - If a topic has fewer than 4 questions in the future question bank, it can **never** be classified as `solid` or `needs-attention`; it will remain permanently stuck as `insufficient-evidence`.
6. **Unused `@supabase/supabase-js` Dependency**:
   - The package is present in `package.json` but not utilized. When designing the backend, a decision must be made whether to leverage Supabase as the BaaS or build a dedicated REST API (e.g., Express/FastAPI/NestJS).
7. **Sign-out Wipes All User Test History**:
   - Because `signOut()` calls `storage.clearAll()`, signing out currently deletes all saved test results, diagnostic state, and question reports from the browser.
8. **Missing `node_modules` in Repository**:
   - The repository was imported without dependencies installed; running any npm scripts requires `npm install` first.

---

## 19. Next Steps & Recommendations

1. **Keep UI Frozen:** Maintain the current UI layouts, styling, components, and user flows as requested.
2. **Backend Architecture Decision:**
   - Option A: **Supabase** (BaaS) — Leverage the already-installed `@supabase/supabase-js` library for Auth, PostgreSQL database, Row Level Security (RLS), and Storage buckets.
   - Option B: **Node.js / Express or FastAPI Backend** — Build a standalone REST API with PostgreSQL/Prisma or SQLAlchemy.
3. **Data Layer Decoupling:**
   - Abstract `src/lib/storage.ts` behind an asynchronous service interface (`api.ts`), so the frontend can seamlessly swap from `localStorage` to real HTTP API calls without modifying any UI pages.
4. **Curriculum Expansion:**
   - Add mock or database questions for `Linked Lists` and practice questions for `Arrays` and `Trees` to prevent user-facing data mismatch bugs.

---
*Audit completed successfully. Ready for architectural review.*
