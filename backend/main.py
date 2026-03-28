import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from bson import ObjectId
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional
from pydantic import BaseModel

from agent import generate_cad_code
from runner import run_cad_code
from database import get_db
from auth import (
    hash_password,
    verify_password,
    create_token,
    require_user,
    require_admin,
    generate_password,
)

OUTPUTS_DIR = "outputs"
os.makedirs(OUTPUTS_DIR, exist_ok=True)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme")

app = FastAPI(title="CAD Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")


# ── Auth models ────────────────────────────────────────────────

class LoginBody(BaseModel):
    username: str
    password: str


class RequestAccessBody(BaseModel):
    name: str
    email: str
    reason: str


# ── Auth endpoints ─────────────────────────────────────────────

@app.post("/auth/login")
async def login(body: LoginBody):
    # Admin credentials come from env vars — no DB lookup needed
    if body.username == ADMIN_USERNAME and body.password == ADMIN_PASSWORD:
        token = create_token(sub=ADMIN_USERNAME, role="admin")
        return {"access_token": token, "role": "admin", "name": "Admin"}

    # Regular users are stored in MongoDB (login by email)
    db = get_db()
    user = await db.users.find_one({"email": body.username})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(sub=str(user["_id"]), role="user")
    return {"access_token": token, "role": "user", "name": user["name"]}


@app.post("/auth/request-access", status_code=201)
async def request_access(body: RequestAccessBody):
    db = get_db()

    # Prevent duplicate pending requests
    existing = await db.access_requests.find_one(
        {"email": body.email, "status": "pending"}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A pending request already exists for this email.",
        )

    await db.access_requests.insert_one(
        {
            "name": body.name,
            "email": body.email,
            "reason": body.reason,
            "status": "pending",
            "requested_at": datetime.now(timezone.utc),
        }
    )
    return {"message": "Request submitted. You will be notified once approved."}


@app.get("/auth/requests")
async def list_requests(_: dict = Depends(require_admin)):
    db = get_db()
    out = []
    async for req in db.access_requests.find({"status": "pending"}):
        out.append(
            {
                "id": str(req["_id"]),
                "name": req["name"],
                "email": req["email"],
                "reason": req["reason"],
                "requested_at": req["requested_at"].isoformat(),
            }
        )
    return out


@app.post("/auth/approve/{request_id}")
async def approve_request(request_id: str, _: dict = Depends(require_admin)):
    db = get_db()

    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    req = await db.access_requests.find_one({"_id": oid, "status": "pending"})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or already processed")

    temp_password = generate_password()
    await db.users.insert_one(
        {
            "name": req["name"],
            "email": req["email"],
            "hashed_password": hash_password(temp_password),
            "role": "user",
            "approved_at": datetime.now(timezone.utc),
        }
    )
    await db.access_requests.update_one({"_id": oid}, {"$set": {"status": "approved"}})

    return {
        "message": "User approved",
        "email": req["email"],
        "temp_password": temp_password,
    }


@app.post("/auth/reject/{request_id}")
async def reject_request(request_id: str, _: dict = Depends(require_admin)):
    db = get_db()

    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    result = await db.access_requests.update_one(
        {"_id": oid, "status": "pending"}, {"$set": {"status": "rejected"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or already processed")

    return {"message": "Request rejected"}


# ── CAD generation (JWT required) ──────────────────────────────

@app.post("/generate")
async def generate(
    description: str = Form(...),
    image: Optional[UploadFile] = File(default=None),
    # _user: dict = Depends(require_user),  # auth bypassed
):
    image_bytes = await image.read() if image else None

    try:
        code = generate_cad_code(description, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {e}")

    run_result = run_cad_code(code, OUTPUTS_DIR)
    if not run_result["success"]:
        raise HTTPException(
            status_code=422,
            detail={"error": run_result["error"], "code": code},
        )

    return {
        "step_url": "/outputs/part.step",
        "stl_url": "/outputs/part.stl",
        "code_preview": code,
    }


@app.get("/outputs/{filename}")
async def download_file(filename: str):
    path = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
