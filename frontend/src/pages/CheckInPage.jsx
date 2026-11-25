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

  const tab = (key, label) => (
    <button onClick={() => setMode(key)}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{label}</button>
  );

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">QR Check-In</h2>
      <div className="mb-4 flex gap-2">{tab("camera", "Scan with camera")}{tab("manual", "Enter ID manually")}</div>

      {result && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="alert">
          {result.text}
        </div>
      )}

      <div className="card mb-5">
        {mode === "camera" ? (
          <>
            <p className="mb-3 text-xs text-slate-500">Camera access needs HTTPS (or localhost) and your permission.</p>
            <QRScanner onScan={verify} />
          </>
        ) : (
          <form className="flex gap-2" onSubmit={handleManual}>
            <input className="input" placeholder="e.g. ACE-2026-00001" value={manualId} onChange={(e) => setManualId(e.target.value)} aria-label="Registration ID" />
            <button className="btn btn-primary">Check in</button>
          </form>
        )}
      </div>

      {history.length > 0 && (
        <div className="card">
          <h3 className="card-title">Checked in this session</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {history.map((h) => (
              <li key={h.id} className="py-2">{h.name} – {h.event} <span className="text-xs text-slate-400">({h.id}, {formatDateTime(h.at)})</span></li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
