import base64
import subprocess
import tempfile
import os

SYSTEM_PROMPT = """You are an expert CAD engineer. Your job is to write valid CadQuery Python code that generates a mechanical part based on the user's description.

Rules:
- Return ONLY executable Python code, no markdown fences, no explanation.
- Import cadquery as cq at the top.
- The final result must be a variable named `result` of type `cq.Workplane`.
- Export to both STEP and STL using these exact paths:
    result.val().exportStep("outputs/part.step")
    result.exportStl("outputs/part.stl")
- Use sensible default dimensions (mm) if not specified.
- Keep the code simple and correct — do not use unsupported CadQuery features."""


def generate_cad_code(description: str, image_bytes: "bytes | None" = None) -> str:
    prompt = SYSTEM_PROMPT + "\n\nUser request: " + description

    cmd = ["claude", "-p", prompt, "--output-format", "text"]

    if image_bytes:
        # Write image to a temp file and pass via stdin isn't supported for images,
        # so encode description to include a note; image support via CLI is limited
        b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        # Save temp PNG and pass path if claude CLI supports it, otherwise skip
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(image_bytes)
            tmp_path = f.name
        cmd = ["claude", "-p", prompt, "--image", tmp_path, "--output-format", "text"]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if image_bytes:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "claude CLI failed")

    code = result.stdout.strip()
    # Strip accidental markdown fences if model included them
    if code.startswith("```"):
        lines = code.splitlines()
        code = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return code
