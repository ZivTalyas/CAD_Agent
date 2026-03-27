import subprocess
import sys
import tempfile
import os
import textwrap


TIMEOUT_SECONDS = 60


def run_cad_code(code: str, outputs_dir: str = "outputs") -> dict:
    """
    Execute generated CadQuery code in a subprocess.
    Returns {"success": bool, "error": str | None}
    """
    os.makedirs(outputs_dir, exist_ok=True)

    # Write code to a temp file so we get clean tracebacks
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as f:
        # Prepend a cd so relative output paths resolve correctly
        preamble = textwrap.dedent(f"""\
            import os
            os.chdir({repr(os.path.abspath(outputs_dir + "/.." ))})
        """)
        f.write(preamble + code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
        if result.returncode != 0:
            return {"success": False, "error": result.stderr}
        return {"success": True, "error": None}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": f"Execution timed out after {TIMEOUT_SECONDS}s"}
    finally:
        os.unlink(tmp_path)
