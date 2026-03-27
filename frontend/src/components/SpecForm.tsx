import { useState, useRef } from "react";

interface Props {
  onSubmit: (description: string, image?: File) => void;
  loading: boolean;
}

export default function SpecForm({ onSubmit, loading }: Props) {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) onSubmit(description.trim(), image);
  };

  return (
    <form onSubmit={handleSubmit} className="spec-form">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the mechanical part… e.g. 'A cylinder 50mm diameter, 30mm tall with a 10mm hole through the center'"
        rows={5}
        disabled={loading}
      />

      <div className="form-row">
        <button
          type="button"
          className="upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          {image ? `📎 ${image.name}` : "Upload sketch (optional)"}
        </button>
        {image && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setImage(undefined)}
          >
            ✕
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => setImage(e.target.files?.[0])}
        />
      </div>

      <button type="submit" className="generate-btn" disabled={loading || !description.trim()}>
        {loading ? "Generating…" : "Generate CAD"}
      </button>
    </form>
  );
}
