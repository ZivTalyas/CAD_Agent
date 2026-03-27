import base64
import anthropic

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


def generate_cad_code(description: str, image_bytes: bytes | None = None) -> str:
    client = anthropic.Anthropic()

    user_content: list = []

    if image_bytes:
        b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        user_content.append(
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/png", "data": b64},
            }
        )

    user_content.append({"type": "text", "text": description})

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    code = message.content[0].text.strip()
    # Strip accidental markdown fences if model included them
    if code.startswith("```"):
        lines = code.splitlines()
        code = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return code
