# StudyGapRadar — Project Locations Report

## Phase 1 Identification

### A. Original Bolt Frontend
- **Absolute Path**: `C:\Users\cbec\Downloads\StudyGapRadar_Bolt_BACKUP\project` (Archive: `C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7.zip`)
- **Frontend Framework**: React 18.3.1 (TypeScript), Vite, Tailwind CSS, Lucide React
- **package.json Location**: `C:\Users\cbec\Downloads\StudyGapRadar_Bolt_BACKUP\project\package.json`
- **Source Directory**: `C:\Users\cbec\Downloads\StudyGapRadar_Bolt_BACKUP\project\src`
- **Major Routes**:
  - `/` (Landing)
  - `/signin` (SignIn)
  - `/signup` (SignUp)
  - `/onboarding` (Onboarding)
  - `/home` (Dashboard)
  - `/diagnostic/setup` (Diagnostic Setup)
  - `/diagnostic` (Interactive Diagnostic Test)
  - `/results` (Diagnostic & Knowledge Gap Results)
  - `/practice` (Targeted Practice Test)
  - `/practice/complete` (Practice Completion)
  - `/profile` (Student Profile)
  - `/ai-tools` (AI Tools & Summarizer)
  - `/premium` (Premium Tier Preview)
- **Backend Location**: None (purely client-side mock implementation using browser `localStorage`)
- **Git Status**: Not a git repository
- **Bolt Export Status**: Confirmed original Bolt export. Contains `.bolt/config.json` and `.bolt/prompt`.

---

### B. Current Full-Stack / Backend-Integrated Project
- **Absolute Path**: `C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7`
- **Frontend Framework**: React 18.3.1 (TypeScript), Vite, Tailwind CSS, Lucide React (in `project/`)
- **package.json Location**: `C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7\project\package.json`
- **Source Directory**: `C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7\project\src`
- **Major Routes**: Same 13 routes as Bolt UI, wired to backend API client (`src/lib/api.ts`)
- **Backend Location**: `C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7\backend` (FastAPI with 12 routers, 14 models, 8 specialized agents, PyMuPDF ingestion, TF-IDF RAG, and `studygapradar.db`)
- **Git Status**: Not a git repository
- **Bolt Export Status**: Base Bolt frontend integrated with active Python FastAPI full-stack architecture.

---

### C. Directory Mapping

**Original Bolt UI**:  
`C:\Users\cbec\Downloads\StudyGapRadar_Bolt_BACKUP\project`

**Current integrated project**:  
`C:\Users\cbec\Downloads\project-bolt-sb1-78ckjmr7`

**Recommended final working directory**:  
`C:\Users\cbec\Downloads\StudyGapRadar_FINAL`
