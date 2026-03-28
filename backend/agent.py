import base64
import os
import google.generativeai as genai

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
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-2.0-flash")

    parts = [SYSTEM_PROMPT + "\n\nUser request: " + description]

    if image_bytes:
        parts.append({"mime_type": "image/png", "data": base64.standard_b64encode(image_bytes).decode()})

    response = model.generate_content(parts)
    code = response.text.strip()

    # Strip accidental markdown fences if model included them
    if code.startswith("```"):
        lines = code.splitlines()
        code = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return code
