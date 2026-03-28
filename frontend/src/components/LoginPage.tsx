import { useState } from "react";
import { login, requestAccess, type AuthState } from "../auth";

interface Props {
  onLogin: (auth: AuthState) => void;
}

type View = "login" | "request" | "requested";

export default function LoginPage({ onLogin }: Props) {
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Request access fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await login(username, password);
      onLogin(auth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestAccess(name, email, reason);
      setView("requested");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>CAD Agent</h1>
        <p className="auth-subtitle">Describe a part → get a real CAD file</p>

        {view === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Sign in</h2>
            <input
              type="text"
              placeholder="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              className="auth-link"
              onClick={() => { setError(""); setView("request"); }}
            >
              Don't have access? Request it
            </button>
          </form>
        )}

        {view === "request" && (
          <form onSubmit={handleRequestAccess} className="auth-form">
            <h2>Request access</h2>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <textarea
              placeholder="Why do you need access?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Submitting…" : "Submit request"}
            </button>
            <button
              type="button"
              className="auth-link"
              onClick={() => { setError(""); setView("login"); }}
            >
              Back to sign in
            </button>
          </form>
        )}

        {view === "requested" && (
          <div className="auth-form">
            <h2>Request submitted</h2>
            <p className="auth-success">
              Your request has been sent. You'll receive your credentials once approved.
            </p>
            <button
              type="button"
              className="auth-btn"
              onClick={() => setView("login")}
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
