import { useState } from "react";
import QRScanner from "../components/QRScanner";
import { attendanceService } from "../services/endpoints";
import { formatDateTime, getErrorMessage } from "../utils/format";

export default function CheckInPage() {
  const [mode, setMode] = useState("camera");
  const [manualId, setManualId] = useState("");
  const [result, setResult] = useState(null); // { ok, text }
  const [history, setHistory] = useState([]);

  const verify = async (registrationId) => {
    const id = registrationId.trim();
    if (!id) return;
    try {
      const data = await attendanceService.checkIn(id);
      const r = data.registration;
      setResult({ ok: true, text: `✅ ${r.student_name} checked in for ${r.event_title}` });
      setHistory((h) => [{ id: r.registration_id, name: r.student_name, event: r.event_title, at: r.check_in_time }, ...h].slice(0, 10));
    } catch (err) {
      const when = err.response?.data?.check_in_time;
      setResult({ ok: false, text: `❌ ${getErrorMessage(err)}${when ? ` (at ${formatDateTime(when)})` : ""}` });
    }
  };

  const handleManual = (e) => {
    e.preventDefault();
    verify(manualId);
    setManualId("");
  };

  return (
    <>
      <div className="page-header"><h2>QR Check-In</h2></div>
      <div className="tabs">
        <button className={`tab ${mode === "camera" ? "active" : ""}`} onClick={() => setMode("camera")}>Scan with camera</button>
        <button className={`tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>Enter ID manually</button>
      </div>

      {result && <div className={`alert ${result.ok ? "alert-success" : "alert-error"}`}>{result.text}</div>}

      <div className="card">
        {mode === "camera" ? (
          <>
            <p className="muted small">Camera access needs HTTPS (or localhost) and your permission.</p>
            <QRScanner onScan={verify} />
          </>
        ) : (
          <form className="inline-form" onSubmit={handleManual}>
            <input placeholder="e.g. ACE-2026-00001" value={manualId} onChange={(e) => setManualId(e.target.value)} />
            <button className="btn btn-primary">Check in</button>
          </form>
        )}
      </div>

      {history.length > 0 && (
        <div className="card">
          <h3 className="card-title">Checked in this session</h3>
          <ul className="plain-list">
            {history.map((h) => (
              <li key={h.id}>{h.name} – {h.event} <span className="muted small">({h.id}, {formatDateTime(h.at)})</span></li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
