import os
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from agent import generate_cad_code
from runner import run_cad_code

OUTPUTS_DIR = "outputs"
os.makedirs(OUTPUTS_DIR, exist_ok=True)

app = FastAPI(title="CAD Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")


@app.post("/generate")
async def generate(
    description: str = Form(...),
    image: UploadFile | None = File(default=None),
):
    image_bytes = await image.read() if image else None

    # 1. Ask Claude to write CadQuery code
    try:
        code = generate_cad_code(description, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {e}")

    # 2. Execute the code
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
