# Automatic Test Case Generator — Study Guide

Use this guide to understand the app for interviews and learning. It explains **what is what**, **frontend vs backend**, and the **end-to-end flow**.

---

## 1. What the App Does (In One Sentence)

**User enters a user story → app suggests functional modules → user picks a module → app generates test cases (via AI) → user can export to CSV/XLSX.**

---

## 2. Tech Stack

| Layer    | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (React 19), TypeScript, Tailwind CSS |
| **Backend**  | Python, FastAPI, Uvicorn |
| **AI**       | Groq API (LLM: `llama-3.3-70b-versatile`) — with rule-based fallbacks if API fails |
| **Env**      | `python-dotenv` for `GROQ_API_KEY` |

---

## 3. High-Level Flow (Step by Step)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER STORY INPUT                                                          │
│    User types/pastes a user story (e.g. "As a user I want to login...")     │
│    Optional: upload .doc/.docx (filename only used in UI for now)           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. GENERATE MODULES (Frontend → Backend)                                     │
│    User clicks "Generate Modules"                                            │
│    POST /generate-modules { user_story }                                     │
│    Backend calls Groq LLM (or fallback rules) → returns list of module names │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SHOW MODULES (Frontend)                                                   │
│    Modules appear as cards (e.g. "Authentication", "User Management")        │
│    User clicks "Generate Tests" on one module                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. GENERATE TEST CASES (Frontend → Backend)                                 │
│    POST /generate-test-cases { user_story, module }                          │
│    Backend calls Groq LLM (or fallback) → returns test cases (id, title,     │
│    steps, expected_result)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SHOW & EXPORT (Frontend)                                                  │
│    Test cases shown in a table; user can Regenerate, Download CSV or XLSX    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend — What Is What

### 4.1 Entry Point & State

- **File:** `frontend/src/app/page.tsx`
- **Role:** Single page that holds **all app state** and wires components together.

**State variables:**

| State                 | Type              | Purpose |
|-----------------------|-------------------|--------|
| `userStoryText`       | string            | Text in the user story textarea |
| `uploadedFileName`    | string \| null    | Name of uploaded file (for display only in POC) |
| `modules`             | Module[]          | List of modules returned from backend |
| `selectedModule`      | Module \| null    | Module user clicked to generate tests |
| `testCases`           | TestCase[]        | Test cases for the selected module |
| `isGeneratingModules` | boolean           | Loading state for "Generate Modules" |
| `isGeneratingTests`   | boolean           | Loading state for "Generate Tests" |
| `error`               | string \| null    | Error message to show |

### 4.2 Components

| Component           | File                         | What it does |
|--------------------|------------------------------|--------------|
| **UserStoryInput** | `components/UserStoryInput.tsx` | Textarea for user story, file upload (.doc/.docx), "Generate Modules" button. Controlled by `userStoryText`, `onUserStoryChange`, `onGenerate`, etc. |
| **ModulesSection** | `components/ModulesSection.tsx` | Renders the list of modules as cards. Each card has "Generate Tests". Highlights `selectedModule`. Only visible when `modules.length > 0`. |
| **TestCasesSection** | `components/TestCasesSection.tsx` | Shows selected module name, table of test cases (ID, Title, Steps, Expected Result, Priority, Type), Regenerate / XLSX / CSV buttons. Only visible when `selectedModule` is set. |

### 4.3 API Calls (from `page.tsx`)

- **Generate modules:**  
  `POST http://127.0.0.1:8000/generate-modules`  
  Body: `{ user_story: userStoryText }`  
  Response: `{ modules: string[] }` → mapped to `Module[]` (id, name) and stored in `modules`.

- **Generate test cases:**  
  `POST http://127.0.0.1:8000/generate-test-cases`  
  Body: `{ user_story: userStoryText, module: module.name }`  
  Response: `{ test_cases: TestCase[] }` → stored in `testCases`. Backend uses `expected_result`; frontend type uses `expectedResult` (camelCase).

### 4.4 Types

- **File:** `frontend/src/types/test-generation.ts`
- **Module:** `{ id: number; name: string }`
- **TestCase:** `{ id, title, steps, expectedResult, priority?, caseType? }` — backend only returns id, title, steps, expected_result; priority/type are derived in UI if missing.

### 4.5 Export (CSV / XLSX)

- **CSV:** Builds a string with header and rows, escapes quotes, creates a Blob, triggers download. File name: `test-cases-{moduleName}.csv`.
- **XLSX:** Same idea but with extra columns (e.g. Priority, Type) and `.xlsx` extension. (Note: the current implementation still outputs CSV-style content with an xlsx extension; a real XLSX would use a library like `xlsx`.)

---

## 5. Backend — What Is What

### 5.1 Framework & Config

- **File:** `backend/main.py`
- **Framework:** FastAPI
- **CORS:** Allows `localhost:3000` and `127.0.0.1:3000` for the Next.js dev server.
- **Env:** `GROQ_API_KEY` from `.env` (see `backend/.env.example`; code uses Groq, not Gemini).

### 5.2 Data Models (Pydantic)

| Model                      | Use |
|----------------------------|-----|
| `GenerateModulesRequest`   | `user_story: str` |
| `GenerateModulesResponse`  | `modules: List[str]` |
| `GenerateTestCasesRequest` | `user_story: str`, `module: str` |
| `TestCase`                 | `id`, `title`, `steps`, `expected_result` |
| `GenerateTestCasesResponse`| `test_cases: List[TestCase]` |

### 5.3 Endpoints

| Method | Path                  | Purpose |
|--------|------------------------|--------|
| GET    | `/health`              | Health check; returns `{"status": "ok"}`. |
| POST   | `/generate-modules`    | From user story → returns list of module names (AI or fallback). |
| POST   | `/generate-test-cases` | From user story + module → returns list of test cases (AI or fallback). |

### 5.4 AI Integration

- **Function:** `call_groq(system_prompt, user_prompt)`
  - Sends a request to Groq’s OpenAI-compatible API (`https://api.groq.com/openai/v1/chat/completions`).
  - Uses `llama-3.3-70b-versatile`, temperature 0.3.
  - Returns the assistant message content (string).

### 5.5 Fallbacks (When Groq Fails or Key Missing)

- **Modules:** `fallback_modules_from_story(user_story)`  
  Rule-based: looks for keywords (e.g. login, payment, report) and returns a fixed set of module names (e.g. "Authentication", "Payments & Checkout") so the app still works without the LLM.

- **Test cases:** `fallback_test_cases(user_story, module)`  
  Returns 3 fixed test cases: happy path, validation errors, negative scenario. Same structure as AI response.

### 5.6 Response Parsing

- **Modules:** Tries to parse LLM output as JSON array of strings; if that fails, splits by newlines/commas and cleans each line.
- **Test cases:** Expects JSON array of objects with `id`, `title`, `steps`, `expected_result`; maps to `TestCase` and returns. On parse error, returns 500 with detail.

---

## 6. Data Flow Summary

| Step | Frontend action           | Backend                    | Frontend result        |
|------|---------------------------|----------------------------|------------------------|
| 1    | User enters story         | —                          | State updated          |
| 2    | Click "Generate Modules"  | POST /generate-modules     | `modules` set, UI shows cards |
| 3    | Click "Generate Tests" on a module | POST /generate-test-cases | `selectedModule` + `testCases` set |
| 4    | Click CSV / XLSX          | —                          | Browser downloads file |
| 4    | Click Regenerate          | Same as step 3             | `testCases` refreshed  |

---

## 7. Interview Talking Points

- **Architecture:** Single-page Next.js app (client-side state) + REST API (FastAPI). No database; everything is request/response + in-memory state.
- **Separation of concerns:** UI in React components; business/API logic in `page.tsx` and backend; types shared via `test-generation.ts` (frontend) and Pydantic (backend).
- **Resilience:** Backend uses fallbacks so the app works even without a valid `GROQ_API_KEY` (demos, interviews).
- **API design:** RESTful POST for two actions; JSON in/out; clear request/response models.
- **CORS:** Backend explicitly allows the frontend origin so browser allows requests from localhost:3000 to localhost:8000.
- **TypeScript vs Python:** Frontend uses TypeScript and shared types; backend uses Pydantic for validation and serialization. Field naming: backend `expected_result` (snake_case) vs frontend `expectedResult` (camelCase) — mapping happens when reading the API response.

---

## 8. How to Run (For Demos / Learning)

1. **Backend**
   - `cd backend`
   - Create `.env` with `GROQ_API_KEY=your_key` (or leave empty to use fallbacks).
   - `pip install -r requirements.txt`
   - `uvicorn main:app --reload --port 8000`

2. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev` (default port 3000)

3. Open `http://localhost:3000`, enter a user story, click "Generate Modules", then "Generate Tests" on a module. Use CSV/XLSX to export.

---

## 9. File Map (Quick Reference)

```
Automatic Test Case generater/
├── backend/
│   ├── main.py              # FastAPI app, Groq, fallbacks, 2 POST + health
│   ├── requirements.txt     # fastapi, uvicorn, python-dotenv, requests
│   └── .env / .env.example  # GROQ_API_KEY
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx     # Main page, state, API calls, export logic
│       │   ├── layout.tsx   # Root layout, fonts
│       │   └── globals.css  # Global styles
│       ├── components/
│       │   ├── UserStoryInput.tsx   # Story textarea + file upload + Generate Modules
│       │   ├── ModulesSection.tsx   # Module cards + Generate Tests
│       │   └── TestCasesSection.tsx # Test table + Regenerate / CSV / XLSX
│       └── types/
│           └── test-generation.ts  # Module, TestCase
└── STUDY_GUIDE.md           # This file
```

You now have a clear picture of **flow**, **frontend**, **backend**, and **what is what** for interviews and learning.
