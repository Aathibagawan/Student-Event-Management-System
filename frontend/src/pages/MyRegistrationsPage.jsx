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
  const { data, loading, error, reload } = useFetch(() => registrationService.list({ page_size: 100 }), []);
  const [qrFor, setQrFor] = useState(null);
  const registrations = data?.results;

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">My Registrations</h2>
      {loading && <Loader />}
      <ErrorMessage message={error} onRetry={reload} />
      {!loading && registrations?.length === 0 && (
        <EmptyState title="No registrations yet" text="Register for an event to get your QR code.">
          <Link className="btn btn-primary mt-2" to="/events">Browse events</Link>
        </EmptyState>
      )}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {registrations?.map((r) => (
          <div className="card space-y-2" key={r.id}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">{r.registration_id}</strong>
              <StatusBadge value={r.status} />
            </div>
            <h3 className="text-lg font-semibold">{r.event_title}</h3>
            <p className="text-sm text-slate-500">📅 {formatDate(r.event_date)} · 📍 {r.event_venue}</p>
            <p className="text-sm">Attendance: <StatusBadge value={r.attendance_status} /></p>
            {r.check_in_time && <p className="text-xs text-slate-500">Checked in at {formatDateTime(r.check_in_time)}</p>}
            <button className="btn btn-sm btn-primary" onClick={() => setQrFor(r)}>View QR code</button>
          </div>
        ))}
      </div>
      {qrFor && (
        <Modal title={`QR – ${qrFor.registration_id}`} onClose={() => setQrFor(null)}>
          <p className="mb-3 text-center text-sm text-slate-500">Show this at the entrance. Volunteers scan it to mark your attendance.</p>
          <QRImage registrationPk={qrFor.id} registrationId={qrFor.registration_id} />
        </Modal>
      )}
    </>
  );
}
