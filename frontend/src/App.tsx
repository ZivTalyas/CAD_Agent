import { useState } from "react";
import SpecForm from "./components/SpecForm";
import Viewer3D from "./components/Viewer3D";
import DownloadPanel from "./components/DownloadPanel";
import StatusLog from "./components/StatusLog";
import { generateCAD, type GenerateResult } from "./api";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (description: string, image?: File) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await generateCAD(description, image);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>CAD Agent</h1>
        <p>Describe a mechanical part → get a real CAD file</p>
      </header>

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
    </div>
  );
}
