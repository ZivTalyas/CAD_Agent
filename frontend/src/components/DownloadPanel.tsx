interface Props {
  stepUrl: string;
  stlUrl: string;
}

export default function DownloadPanel({ stepUrl, stlUrl }: Props) {
  return (
    <div className="download-panel">
      <h3>Download</h3>
      <a href={stepUrl} download="part.step" className="dl-btn">
        ⬇ STEP
      </a>
      <a href={stlUrl} download="part.stl" className="dl-btn">
        ⬇ STL
      </a>
    </div>
  );
}
