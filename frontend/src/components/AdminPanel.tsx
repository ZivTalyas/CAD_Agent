import { useEffect, useState } from "react";
import { fetchRequests, approveRequest, rejectRequest, type AccessRequest } from "../auth";

interface Props {
  token: string;
}

interface ApprovalResult {
  email: string;
  temp_password: string;
}

export default function AdminPanel({ token }: Props) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvals, setApprovals] = useState<Record<string, ApprovalResult>>({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await fetchRequests(token));
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    try {
      const result = await approveRequest(token, id);
      setApprovals((prev) => ({ ...prev, [id]: result }));
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(token, id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to reject request");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Access Requests</h2>
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {Object.entries(approvals).map(([id, result]) => (
        <div key={id} className="approval-result">
          <strong>Approved:</strong> {result.email}
          <br />
          <strong>Temp password:</strong>{" "}
          <code>{result.temp_password}</code>
          <span className="approval-note"> — share this with the user</span>
        </div>
      ))}

      {!loading && requests.length === 0 && (
        <p className="no-requests">No pending requests.</p>
      )}

      {requests.map((req) => (
        <div key={req.id} className="request-card">
          <div className="request-info">
            <span className="request-name">{req.name}</span>
            <span className="request-email">{req.email}</span>
            <p className="request-reason">{req.reason}</p>
            <span className="request-date">
              {new Date(req.requested_at).toLocaleString()}
            </span>
          </div>
          <div className="request-actions">
            <button
              className="approve-btn"
              onClick={() => handleApprove(req.id)}
            >
              Approve
            </button>
            <button
              className="reject-btn"
              onClick={() => handleReject(req.id)}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
