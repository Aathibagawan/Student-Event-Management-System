import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Modal from "../components/Modal";
import QRImage from "../components/QRImage";
import StatusBadge from "../components/StatusBadge";
import useFetch from "../hooks/useFetch";
import { registrationService } from "../services/endpoints";
import { formatDate, formatDateTime } from "../utils/format";

export default function MyRegistrationsPage() {
  const { data, loading, error, reload } = useFetch(() => registrationService.list(), []);
  const [qrFor, setQrFor] = useState(null);

  return (
    <>
      <div className="page-header"><h2>My Registrations</h2></div>
      {loading && <Loader />}
      <ErrorMessage message={error} onRetry={reload} />
      {!loading && data?.length === 0 && (
        <EmptyState title="No registrations yet" text="Register for an event to get your QR code.">
          <Link className="btn btn-primary" to="/events">Browse events</Link>
        </EmptyState>
      )}
      <div className="card-grid">
        {data?.map((r) => (
          <div className="card" key={r.id}>
            <div className="card-row">
              <strong>{r.registration_id}</strong>
              <StatusBadge value={r.status} />
            </div>
            <h3>{r.event_title}</h3>
            <p className="muted small">📅 {formatDate(r.event_date)} · 📍 {r.event_venue}</p>
            <p className="small">Attendance: <StatusBadge value={r.attendance_status} /></p>
            {r.check_in_time && <p className="muted small">Checked in at {formatDateTime(r.check_in_time)}</p>}
            <div className="card-actions">
              <button className="btn btn-sm btn-primary" onClick={() => setQrFor(r)}>View QR code</button>
            </div>
          </div>
        ))}
      </div>
      {qrFor && (
        <Modal title={`QR – ${qrFor.registration_id}`} onClose={() => setQrFor(null)}>
          <p className="muted center">Show this at the entrance. Volunteers scan it to mark your attendance.</p>
          <QRImage registrationPk={qrFor.id} registrationId={qrFor.registration_id} />
        </Modal>
      )}
    </>
  );
}
