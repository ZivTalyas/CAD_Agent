export interface GenerateResult {
  step_url: string;
  stl_url: string;
  code_preview: string;
}

export async function generateCAD(
  description: string,
  image?: File,
  token?: string
): Promise<GenerateResult> {
  const form = new FormData();
  form.append("description", description);
  if (image) form.append("image", image);

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("/generate", { method: "POST", headers, body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    if (typeof detail === "object" && detail.error) {
      throw new Error(`Code execution failed:\n${detail.error}`);
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return res.json();
}
