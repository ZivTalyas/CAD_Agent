# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CAD Agent is a full-stack web app that converts plain English descriptions (and optional sketch images) into downloadable mechanical CAD files (STEP/STL). The pipeline is:

**Text/Image → Claude API → CadQuery Python code → Subprocess execution → STEP/STL files → Three.js 3D preview**

Access is gated behind JWT authentication. Users must request access; only the admin can approve requests and create accounts.

## Development Commands

### Backend (Python/FastAPI)
```bash
cd backend
# Python 3.9 is required (cadquery constraint)
/c/Users/ziv1t/AppData/Local/Programs/Python/Python39/python.exe -m venv .venv
source .venv/Scripts/activate          # Windows/Git Bash
pip install -r requirements.txt
# Copy .env.example to .env and fill in all values
set -a && source .env && set +a
uvicorn main:app --reload              # Runs on port 8000
```

### Frontend (React/Vite/TypeScript)
```bash
cd frontend
npm install
npm run dev      # Runs on port 5173
npm run build    # tsc && vite build
```

Access the app at http://localhost:5173. The Vite dev server proxies `/generate`, `/outputs`, and `/auth` to `http://localhost:8000`.

## Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `MONGODB_URL` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Long random string for signing JWTs |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password (plaintext in env, compared at runtime) |

The `.env` file is gitignored. See `backend/.env.example` for the template.

## Architecture

### Backend (`backend/`)
- **`main.py`** — FastAPI app with CORS, static file serving, auth endpoints, and the protected `POST /generate` endpoint
- **`agent.py`** — Calls Claude (`claude-sonnet-4-6`, max 2048 tokens) with a strict system prompt requiring the model to output only valid CadQuery Python (no markdown). Supports optional base64-encoded PNG image input. Strips accidental markdown fences from output.
- **`runner.py`** — Executes generated code in a subprocess (60s timeout). Prepends a `os.chdir()` preamble so relative output paths (`outputs/part.step`) resolve correctly. Returns `{"success": bool, "error": str | None}`.
- **`database.py`** — Motor (async) MongoDB client. Returns the `cad_agent` database. Collections: `users`, `access_requests`.
- **`auth.py`** — bcrypt password hashing, JWT creation/verification (`python-jose`), and FastAPI dependencies `require_user` / `require_admin`.
- **`outputs/`** — Where generated STEP/STL files land; served as static files.

### Auth Flow
- Anyone can `POST /auth/request-access` (name, email, reason) — stored as a pending request in MongoDB
- Admin logs in via `POST /auth/login` using `ADMIN_USERNAME`/`ADMIN_PASSWORD` from env — gets JWT with `role=admin`
- Admin approves via `POST /auth/approve/{id}` — creates user in MongoDB, returns a one-time temp password to share
- Regular users log in with email + that password — get JWT with `role=user`
- `POST /generate` requires a valid JWT (any role); admin panel endpoints require `role=admin`

### Auth Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Returns JWT |
| POST | `/auth/request-access` | None | Submit access request |
| GET | `/auth/requests` | Admin | List pending requests |
| POST | `/auth/approve/{id}` | Admin | Approve request, create user, return temp password |
| POST | `/auth/reject/{id}` | Admin | Reject request |

### Frontend (`frontend/src/`)
- **`App.tsx`** — Root component; shows `LoginPage` when unauthenticated, admin gets "Access Requests" toggle in header
- **`auth.ts`** — Auth API calls (login, request-access, approve, reject) + `localStorage` persistence of JWT
- **`components/LoginPage.tsx`** — Login form with "Request access" toggle view
- **`components/AdminPanel.tsx`** — Lists pending requests; approve shows temp password to share with user
- **`components/SpecForm.tsx`** — Description textarea + image upload; calls `generateCAD()` from `api.ts`
- **`components/Viewer3D.tsx`** — Three.js STL viewer with OrbitControls, auto-centers geometry, cleans up WebGL on unmount
- **`components/StatusLog.tsx`** — Displays generated code or error message
- **`components/DownloadPanel.tsx`** — Browser download links for STEP/STL
- **`api.ts`** — `generateCAD()` sends `FormData` + `Authorization: Bearer <token>` to `/generate`

## Key Constraints

- **Python 3.9** — The venv must use Python 3.9 (`Python39`). The `X | Y` union type syntax is not supported; use `Optional[X]` from `typing` instead.
- The system prompt in `agent.py` requires Claude to produce a `result` variable of type `cq.Workplane` and export to both `outputs/part.step` and `outputs/part.stl`. Changes to this contract must be reflected in both `agent.py` and `runner.py`.
- CORS is locked to `http://localhost:5173` in `main.py`.
- TypeScript is in strict mode with no unused variables/parameters allowed (`tsconfig.json`).
- Generated CAD output files are gitignored (`*.step`, `*.stl`, `*.dxf`).
- Admin credentials are stored only in env vars — never in MongoDB.
