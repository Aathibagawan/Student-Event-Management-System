import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorMessage, Loader } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { eventService, userService } from "../services/endpoints";
import { formatDate, formatDateTime, formatMoney, formatTime, getErrorMessage } from "../utils/format";

function VolunteerManager({ eventId }) {
  const assigned = useFetch(() => eventService.volunteers(eventId), [eventId]);
  const all = useFetch(() => userService.volunteers(), []);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const assign = async () => {
    setError("");
    try {
      await eventService.assignVolunteer(eventId, Number(selected));
      setSelected("");
      assigned.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (volunteerId) => {
    try {
      await eventService.unassignVolunteer(eventId, volunteerId);
      assigned.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Volunteers</h3>
      <ErrorMessage message={error} />
      <ul className="plain-list">
        {assigned.data?.map((a) => (
          <li key={a.id} className="card-row">
            <span>{a.volunteer.full_name} <span className="muted small">({a.volunteer.email})</span></span>
            <button className="btn btn-sm btn-danger" onClick={() => remove(a.volunteer.id)}>Remove</button>
          </li>
        ))}
        {assigned.data?.length === 0 && <li className="muted">No volunteers assigned.</li>}
      </ul>
      <div className="inline-form">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select volunteer...</option>
          {all.data?.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
        </select>
        <button className="btn btn-primary" disabled={!selected} onClick={assign}>Assign</button>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: ev, loading, error, reload } = useFetch(() => eventService.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const handleRegister = async () => {
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      const res = await eventService.register(id);
      setMessage(`${res.message}! Your registration ID is ${res.registration_id}.`);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err)); // 400 / 409 messages come straight from Django
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  return (
    <>
      <div className="page-header">
        <h2>{ev.title}</h2>
        <StatusBadge value={ev.status} />
      </div>
      <div className="grid-2 gap">
        <div className="card">
          <p>{ev.description || "No description provided."}</p>
          <dl className="details">
            <dt>Type</dt><dd>{ev.event_type}</dd>
            <dt>Date</dt><dd>{formatDate(ev.date)}</dd>
            <dt>Time</dt><dd>{formatTime(ev.start_time)} – {formatTime(ev.end_time)}</dd>
            <dt>Venue</dt><dd>{ev.venue}</dd>
            <dt>Register by</dt><dd>{formatDateTime(ev.registration_deadline)}</dd>
            <dt>Fee</dt><dd>{Number(ev.registration_fee) ? formatMoney(ev.registration_fee) : "Free"}</dd>
            <dt>Seats</dt><dd>{ev.registered_count} / {ev.max_participants} ({ev.spots_left} left)</dd>
          </dl>
          {user.role === "student" && (
            <div className="register-box">
              <ErrorMessage message={actionError} />
              {message && <div className="alert alert-success">{message}</div>}
              {ev.is_registered ? (
                <Link className="btn btn-primary" to="/my-registrations">You're registered – view QR code</Link>
              ) : (
                <button className="btn btn-primary" onClick={handleRegister} disabled={busy}>
                  {busy ? "Registering..." : "Register for this event"}
                </button>
              )}
            </div>
          )}
          {user.role === "admin" && <Link className="btn" to={`/registrations?event=${ev.id}`}>View registrations</Link>}
        </div>
        {user.role === "admin" && <VolunteerManager eventId={ev.id} />}
      </div>
    </>
  );
}
