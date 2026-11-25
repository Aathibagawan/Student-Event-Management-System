import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorMessage, Loader } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useFetch from "../hooks/useFetch";
import { eventService, userService } from "../services/endpoints";
import { formatDate, formatDateTime, formatMoney, formatTime, getErrorMessage } from "../utils/format";

function VolunteerManager({ eventId }) {
  const toast = useToast();
  const assigned = useFetch(() => eventService.volunteers(eventId), [eventId]);
  const all = useFetch(() => userService.volunteers(), []);
  const [selected, setSelected] = useState("");

  const assign = async () => {
    try {
      await eventService.assignVolunteer(eventId, Number(selected));
      toast.success("Volunteer assigned.");
      setSelected("");
      assigned.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (volunteerId) => {
    try {
      await eventService.unassignVolunteer(eventId, volunteerId);
      toast.success("Volunteer removed.");
      assigned.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Volunteers</h3>
      <ul className="mb-4 divide-y divide-slate-100">
        {assigned.data?.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span>{a.volunteer.full_name} <span className="text-xs text-slate-400">({a.volunteer.email})</span></span>
            <button className="btn btn-sm btn-danger" onClick={() => remove(a.volunteer.id)}>Remove</button>
          </li>
        ))}
        {assigned.data?.length === 0 && <li className="py-2 text-sm text-slate-500">No volunteers assigned.</li>}
      </ul>
      <div className="flex gap-2">
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Select volunteer">
          <option value="">Select volunteer...</option>
          {all.data?.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
        </select>
        <button className="btn btn-primary" disabled={!selected} onClick={assign}>Assign</button>
      </div>
    </div>
  );
}

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-medium">{children}</dd>
  </div>
);

export default function EventDetailPage() {
  const { id } = useParams(); // dynamic route: /events/:id
  const { user } = useAuth();
  const toast = useToast();
  const { data: ev, loading, error, reload } = useFetch(() => eventService.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleRegister = async () => {
    setBusy(true);
    setActionError("");
    try {
      const res = await eventService.register(id);
      toast.success(`Registered! Your registration ID is ${res.registration_id}.`);
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
      <Link to="/events" className="mb-3 inline-block text-sm text-indigo-600 hover:underline">← Back to events</Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">{ev.title}</h2>
        <StatusBadge value={ev.status} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card space-y-4">
          {ev.poster && <img src={ev.poster} alt={`${ev.title} poster`} className="max-h-72 w-full rounded-lg object-cover" />}
          <p className="text-slate-600">{ev.description || "No description provided."}</p>
          <dl>
            <Row label="Type">{ev.event_type}</Row>
            <Row label="Date">{formatDate(ev.date)}</Row>
            <Row label="Time">{formatTime(ev.start_time)} – {formatTime(ev.end_time)}</Row>
            <Row label="Venue">{ev.venue}</Row>
            <Row label="Register by">{formatDateTime(ev.registration_deadline)}</Row>
            <Row label="Fee">{Number(ev.registration_fee) ? formatMoney(ev.registration_fee) : "Free"}</Row>
            <Row label="Seats">{ev.registered_count} / {ev.max_participants} ({ev.spots_left} left)</Row>
          </dl>
          {user.role === "student" && (
            <div className="space-y-3">
              <ErrorMessage message={actionError} />
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
