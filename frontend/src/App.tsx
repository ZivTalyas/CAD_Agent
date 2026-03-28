import { useState } from "react";
import SpecForm from "./components/SpecForm";
import Viewer3D from "./components/Viewer3D";
import DownloadPanel from "./components/DownloadPanel";
import StatusLog from "./components/StatusLog";
import LoginPage from "./components/LoginPage";
import AdminPanel from "./components/AdminPanel";
import { generateCAD, type GenerateResult } from "./api";
import { loadAuth, clearAuth, type AuthState } from "./auth";
import "./App.css";

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
    setResult(null);
    setError("");
  };

  const handleGenerate = async (description: string, image?: File) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await generateCAD(description, image, auth?.token);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // if (!auth) {
  //   return <LoginPage onLogin={setAuth} />;
  // }

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>CAD Agent</h1>
          <p>Describe a mechanical part → get a real CAD file</p>
        </div>
        <div className="header-right">
          {auth.role === "admin" && (
            <button
              className="admin-toggle"
              onClick={() => setShowAdmin((v) => !v)}
            >
              {showAdmin ? "CAD Generator" : "Access Requests"}
            </button>
          )}
          <span className="user-name">{auth.name}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {auth.role === "admin" && showAdmin ? (
        <AdminPanel token={auth.token} />
      ) : (
        <main>
          <section className="left-panel">
            <SpecForm onSubmit={handleGenerate} loading={loading} />
            <StatusLog code={result?.code_preview ?? ""} error={error} />
          </section>

          <section className="right-panel">
            {result ? (
              <>
                <div className="viewer-wrapper">
                  <Viewer3D stlUrl={result.stl_url} />
                </div>
                <DownloadPanel stepUrl={result.step_url} stlUrl={result.stl_url} />
              </>
            ) : (
              <div className="empty-viewer">
                {loading ? "⚙ Generating your part…" : "3D preview will appear here"}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
