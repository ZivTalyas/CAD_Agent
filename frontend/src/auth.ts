export interface AuthState {
  token: string;
  role: "admin" | "user";
  name: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  requested_at: string;
}

const TOKEN_KEY = "cad_agent_auth";

export function saveAuth(state: AuthState): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(state));
}

export function loadAuth(): AuthState | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? (JSON.parse(raw) as AuthState) : null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<AuthState> {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Login failed");
  }
  const data = await res.json();
  const state: AuthState = { token: data.access_token, role: data.role, name: data.name };
  saveAuth(state);
  return state;
}

export async function requestAccess(
  name: string,
  email: string,
  reason: string
): Promise<void> {
  const res = await fetch("/auth/request-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Request failed");
  }
}

export async function fetchRequests(token: string): Promise<AccessRequest[]> {
  const res = await fetch("/auth/requests", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

export async function approveRequest(
  token: string,
  id: string
): Promise<{ email: string; temp_password: string }> {
  const res = await fetch(`/auth/approve/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to approve request");
  return res.json();
}

export async function rejectRequest(token: string, id: string): Promise<void> {
  const res = await fetch(`/auth/reject/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reject request");
}
