# StudyGapRadar — Complete VS Code Local Run Guide (Windows PC)

This guide provides step-by-step instructions to open, run, and test the final integrated **StudyGapRadar** application directly inside Visual Studio Code on Windows.

---

## 1. Final Project Location

The absolute path of the final, complete project containing the original Bolt frontend, FastAPI backend, SQLite database, 8 autonomous AI agents, notes ingestion, and Free vs Premium gating is:

```
C:\Users\cbec\Downloads\StudyGapRadar_FINAL
```

*(Note: `c:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7` contains the exact same synchronized code).*

**Open `C:\Users\cbec\Downloads\StudyGapRadar_FINAL` in VS Code.**

---

## 2. Technology Stack Verification

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 (TypeScript) | Original Bolt UI with Tailwind CSS & Lucide React |
| **Frontend Build Tool** | Vite 5.4.8 | High-speed ESM development server & production bundler |
| **Frontend Package Manager** | `npm` | Node.js ecosystem (`package.json` located in `project/`) |
| **Backend Framework** | FastAPI 0.110+ | High-performance Python async REST API |
| **Backend Server** | Uvicorn | ASGI server with hot-reloading |
| **Python Requirement** | Python 3.10+ | Tested on Python 3.13.7 |
| **Database** | SQLite + SQLAlchemy 2.0 | File-based database (`studygapradar.db` in project root) |
| **Database Initialization** | 100% Automatic | Tables and migrations created on server startup |
| **AI Architecture** | Dual-Tier Intelligence | OpenAI LLM (`gpt-4o-mini`) + deterministic domain fallback |
| **Document Ingestion** | PyMuPDF (fitz) + TF-IDF | Ingests PDF course syllabi & lecture notes for AI tutoring |

---

## 3. Environment Variables Configuration

StudyGapRadar uses a single `.env` file located in the **project root**:

```
C:\Users\cbec\Downloads\StudyGapRadar_FINAL\.env
```

### Create Your `.env` File
In Windows PowerShell from the project root:
```powershell
Copy-Item .env.example .env
```

### Environment Variable Reference:
```env
# ========================================================
# StudyGapRadar Configuration
# ========================================================

# Backend Core Settings
PROJECT_NAME="StudyGapRadar API"
VERSION="1.0.0"
API_PREFIX="/api"
SECRET_KEY="studygapradar-secure-academic-secret-key-2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# SQLite Database Location
DATABASE_URL="sqlite:///./studygapradar.db"

# Allowed Cross-Origin Origins
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000","http://localhost:8000"]

# OpenAI API Integration (Optional)
# If provided, the AI Tutor uses OpenAI gpt-4o-mini.
# If omitted or left empty, the built-in deterministic academic domain engine handles all queries.
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"

# Frontend Vite API Destination (Defaults to http://localhost:8000/api)
VITE_API_URL="http://localhost:8000/api"
```

---

## 4. Complete Step-by-Step VS Code Setup

### Step 1: Open VS Code
1. Launch **Visual Studio Code**.
2. Click **File** > **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select and open:
   ```
   C:\Users\cbec\Downloads\StudyGapRadar_FINAL
   ```

---

### Step 2: Open VS Code Integrated Terminal
1. Press `Ctrl + ` ` (backtick) or go to **Terminal** > **New Terminal**.
2. Ensure the terminal shell is set to **PowerShell** (the default on Windows).

---

### Step 3: Set Up Python Virtual Environment
Run the following commands in the project root:

```powershell
# If script execution is restricted on your machine, run this first:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Create virtual environment named 'venv' (if not already created)
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```
*(You will see `(venv)` appear at the beginning of your command prompt).*

---

### Step 4: Install Backend Dependencies
With `(venv)` active:
```powershell
pip install -r requirements.txt
```

---

### Step 5: Install Frontend Dependencies
```powershell
cd project
npm install
cd ..
```

---

## 5. Two-Terminal Running Method

StudyGapRadar runs with a FastAPI backend server and a Vite frontend dev server. In VS Code, open two terminals side-by-side (click the **Split Terminal** icon in the terminal tab bar).

```
+------------------------------------+------------------------------------+
| TERMINAL 1: BACKEND (Port 8000)     | TERMINAL 2: FRONTEND (Port 5173)   |
|                                    |                                    |
| .\venv\Scripts\Activate.ps1        | cd project                         |
| python -m uvicorn backend.main:app | npm run dev                        |
|   --port 8000 --reload             |                                    |
+------------------------------------+------------------------------------+
```

---

### TERMINAL 1 — BACKEND SERVER

**Command:**
```powershell
cd C:\Users\cbec\Downloads\StudyGapRadar_FINAL
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --port 8000 --reload
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:backend.main:Curriculum verified (Data Structures: 8 topics, 32 questions).
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

**Backend Health Check:**
* Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Status Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

---

### TERMINAL 2 — FRONTEND DEV SERVER

**Command:**
```powershell
cd C:\Users\cbec\Downloads\StudyGapRadar_FINAL\project
npm run dev
```

**Expected Output:**
```
  VITE v5.4.8  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### Browser Access URL:
Open your browser (Chrome, Edge, Brave, etc.) and navigate to:
```
http://localhost:5173
```

---

## 6. Ports & Port Conflict Management

| Service | Default Port | Config File |
| :--- | :--- | :--- |
| **Frontend** | `5173` | `project/vite.config.ts` |
| **Backend** | `8000` | `backend/main.py` / `uvicorn` command |

### How to Resolve Port Conflicts
* **If port 8000 is occupied**:
  Run backend on another port (e.g. 8001):
  ```powershell
  python -m uvicorn backend.main:app --port 8001 --reload
  ```
  Then in `project/.env` or in terminal, set:
  ```powershell
  $env:VITE_API_URL="http://localhost:8001/api"
  ```
* **If port 5173 is occupied**:
  Vite will automatically suggest port `5174` or you can force it:
  ```powershell
  npm run dev -- --port 5174
  ```

---

## 7. Database & Automatic Migrations

* **No manual SQL installation or database creation is needed.**
* The application uses SQLite. When `backend.main:app` starts, it automatically creates `studygapradar.db` in your root folder.
* **Auto-Migrations**: The startup routine runs `check_and_migrate_db()` to automatically inspect columns and add `ai_questions_used` and `ai_question_limit` without altering or losing data.
* **Default Demo Student Account**:
  * **Email**: `demo@studygapradar.app`
  * **Password**: `demo12345`

---

## 8. Complete 20-Step Browser Test Checklist

Follow this checklist to verify 100% of the functionality:

1. **Landing Page (`/`)**:
   - Open `http://localhost:5173`.
   - Verify hero text: *"Find out what you don't know before your exams do."*
2. **Signup (`/signup`)**:
   - Register a new student (e.g. `student1@college.edu`).
3. **Login (`/signin`)**:
   - Log in with your new credentials, or click **"Try demo mode"** (auto-fills Aarav Sharma).
4. **Onboarding (`/onboarding`)**:
   - Select Branch (*Computer Science & Engineering*), Semester (*Semester 5*), Exam Goal (*Semester Exams*).
5. **Upload Notes/PDF (`/ai-tools`)**:
   - Upload any `.pdf` or `.txt` course notes (or paste notes in textarea).
6. **Material Analysis**:
   - Material Analyzer Agent chunks content, indexes topics, and logs confirmation.
7. **Diagnostic Assessment (`/diagnostic/setup`)**:
   - Select topics (*Arrays*, *Recursion*, *Trees*, *Linked Lists*) and launch assessment.
8. **View Results (`/results`)**:
   - Answer questions and submit. Results show mastery status per topic (*Needs Attention* / *Solid*).
9. **Graphs & Radar Chart**:
   - Review the radar/bar mastery breakdown and priority gap scores.
10. **Continue Prep (`/home`)**:
    - Click "Continue Prep" to navigate to the live personalized dashboard.
11. **Study Plan (`/home`)**:
    - Review the auto-generated calendar schedule crafted by the Planning Agent.
12. **Study Session Progress**:
    - Click a session card and mark it completed with a duration reflection.
13. **Targeted Practice Quiz (`/practice`)**:
    - Launch practice test for your weakest topic.
14. **Replanning Agent**:
    - Scoring low on a quiz dynamically triggers the Replanning Agent to reschedule reinforcement sessions.
15. **Notes-Aware AI Tutor (`/ai-tools`)**:
    - Submit conceptual questions (e.g., *"Explain binary tree traversal simply"*).
    - Tutor answers with ground citations from your uploaded notes.
16. **Free AI 3-Question Limit**:
    - Notice counter pill: `AI Tutor: 1 / 3 free questions used` $\to$ `2/3` $\to$ `3/3`.
    - On 4th attempt, AI Tutor is locked with a friendly prompt:
      *"You've reached your free AI Tutor limit (3/3 questions used). Upgrade to Premium for unlimited AI tutoring..."*
17. **Premium Functionality & Upgrade**:
    - Click **[Upgrade to Premium]** on the upgrade modal or `/premium` page.
    - One-click upgrade switches your account to `Premium`.
    - Badge updates to `Premium AI Tutor` with `Unlimited AI Questions`.
    - Gated features unlock (AI Question Generation, Variations, Difficulty Tagging).
18. **Dashboard Analytics (`/home`)**:
    - Verify Overall Preparedness %, Target Readiness, and Study Streak counter.
19. **Live Agent Activity Stream (`/ai-tools`)**:
    - Observe the real-time event stream logging actions from all 8 autonomous agents.
20. **Logout & Persistent Session**:
    - Click **Sign out** and log back in. Your mastery, plan, and Premium status remain fully intact.

---

## 9. Troubleshooting Common Windows Errors

### Error 1: `npm : The term 'npm' is not recognized`
* **Fix**: Install [Node.js (LTS)](https://nodejs.org/) on your PC. After installation, restart VS Code so Windows refreshes its `PATH`.

### Error 2: `python : The term 'python' is not recognized`
* **Fix**: Install Python from [python.org](https://www.python.org/). **Check the box "Add python.exe to PATH" during installation**.

### Error 3: `cannot be loaded because running scripts is disabled on this system`
* **Fix**: Windows PowerShell restricts script execution by default. Run this in your VS Code terminal:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Then re-run `.\venv\Scripts\Activate.ps1`.

### Error 4: `OSError: [WinError 10048] Only one usage of each socket address is normally permitted`
* **Fix**: Port 8000 is currently occupied by another process.
  Find and kill the process holding port 8000:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```
  Or simply launch backend on port 8001:
  ```powershell
  python -m uvicorn backend.main:app --port 8001 --reload
  ```

### Error 5: `CORS error` in browser console
* **Fix**: The backend CORS middleware allows `http://localhost:5173` and `http://127.0.0.1:5173`. Ensure you are opening the frontend from `http://localhost:5173` (not from `0.0.0.0` or a raw file).

### Error 6: `ModuleNotFoundError: No module named 'fastapi'`
* **Fix**: You forgot to activate the virtual environment. Run:
  ```powershell
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```

### Error 7: `Frontend cannot connect to backend` / `NetworkError`
* **Fix**: Ensure Terminal 1 is running `uvicorn` on `http://127.0.0.1:8000`. Test it by opening `http://localhost:8000/docs` in your browser.

### Error 8: Blank white screen on `http://localhost:5173`
* **Fix**: Open Developer Tools (`F12` > **Console**). If you see a caching issue, clear localStorage by opening the console and typing:
  ```js
  localStorage.clear(); location.reload();
  ```
