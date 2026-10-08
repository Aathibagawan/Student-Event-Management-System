import { useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import EventForm, { EVENT_STATUSES, EVENT_TYPES } from "../components/EventForm";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { eventService } from "../services/endpoints";
import { formatDate, formatMoney, formatTime, getErrorMessage } from "../utils/format";

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [filters, setFilters] = useState({ search: "", event_type: "", status: "", date: "" });
  const [editing, setEditing] = useState(null); // null | "new" | event object
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: events, loading, error, reload } = useFetch(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    return user.role === "volunteer" ? eventService.assigned() : eventService.list(params);
  }, [filters, user.role]);

  const handleFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await eventService.remove(deleting.id);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>{user.role === "volunteer" ? "Assigned Events" : "Events"}</h2>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing("new")}>+ New Event</button>}
      </div>

      {user.role !== "volunteer" && (
        <div className="filters">
          <input name="search" placeholder="Search by title or venue" value={filters.search} onChange={handleFilter} />
          <select name="event_type" value={filters.event_type} onChange={handleFilter}>
            <option value="">All types</option>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilter}>
            <option value="">All statuses</option>
            {EVENT_STATUSES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input name="date" type="date" value={filters.date} onChange={handleFilter} />
        </div>
      )}

      <ErrorMessage message={actionError || error} onRetry={error ? reload : undefined} />
      {loading && <Loader />}
      {!loading && events?.length === 0 && <EmptyState title="No events found" text="Try changing the filters." />}

      <div className="card-grid">
        {events?.map((ev) => (
          <div className="card event-card" key={ev.id}>
            <div className="card-row">
              <span className="muted small">{ev.event_type}</span>
              <StatusBadge value={ev.status} />
            </div>
            <h3><Link to={`/events/${ev.id}`}>{ev.title}</Link></h3>
            <p className="muted small">📅 {formatDate(ev.date)} · {formatTime(ev.start_time)}</p>
            <p className="muted small">📍 {ev.venue}</p>
            <p className="small">
              {ev.registered_count}/{ev.max_participants} registered · {Number(ev.registration_fee) ? formatMoney(ev.registration_fee) : "Free"}
            </p>
            <div className="card-actions">
              <Link className="btn btn-sm" to={`/events/${ev.id}`}>{user.role === "student" && !ev.is_registered ? "View / Register" : "View"}</Link>
              {user.role === "student" && ev.is_registered && <span className="badge badge-green">Registered</span>}
              {isAdmin && (
                <>
                  <button className="btn btn-sm" onClick={() => setEditing(ev)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setDeleting(ev)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Create Event" : "Edit Event"} onClose={() => setEditing(null)} wide>
          <EventForm event={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          message={`Delete "${deleting.title}"? All its registrations will also be deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </>
  );
}
