interface Props {
  code: string;
  error: string;
}

export default function StatusLog({ code, error }: Props) {
  if (!code && !error) return null;

  return (
    <div className="status-log">
      {error && (
        <div className="log-error">
          <strong>Error</strong>
          <pre>{error}</pre>
        </div>
      )}
      {code && (
        <div className="log-code">
          <strong>Generated CadQuery code</strong>
          <pre>{code}</pre>
        </div>
      )}
    </div>
  );
}
