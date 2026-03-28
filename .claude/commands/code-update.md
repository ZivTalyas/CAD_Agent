# Code Update

After making code changes, do the following steps in order:

## 1. Restart servers

Open two new cmd windows:

**Backend:**
```
start cmd /k "cd /d C:\Users\ziv1t\projects\claude\CAD_Agent\backend && .venv\Scripts\activate && uvicorn main:app --reload"
```

**Frontend:**
```
start cmd /k "cd /d C:\Users\ziv1t\projects\claude\CAD_Agent\frontend && npm run dev"
```

## 2. Push to GitHub

From the project root `C:\Users\ziv1t\projects\claude\CAD_Agent`:

1. Run `git status` to see what changed
2. Stage all changes: `git add -A` (skip files that should not be committed, e.g. `.env`, `*.step`, `*.stl`)
3. Write a concise commit message that describes what was changed and why
4. Commit and push to main: `git push origin main`

Always confirm the push succeeded and report the commit hash to the user.
