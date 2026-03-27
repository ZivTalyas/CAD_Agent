# CAD Agent

Describe a mechanical part in plain English → get a real CAD file (STEP / STL) you can preview and download.

## Stack
- **Frontend** — React + Vite + TypeScript + Three.js
- **Backend** — Python + FastAPI
- **CAD Engine** — CadQuery
- **AI** — Claude API (claude-sonnet-4-6)

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-...                      # Windows: set ANTHROPIC_API_KEY=sk-...
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## How it works
1. User describes a part (+ optional sketch image)
2. FastAPI forwards the spec to Claude which writes CadQuery Python code
3. The code runs in a sandboxed subprocess → generates `part.step` + `part.stl`
4. Frontend renders the STL with Three.js; user downloads STEP/STL
