import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { eventService, registrationService } from "../services/endpoints";
import { formatDateTime, getErrorMessage } from "../utils/format";

export default function RegistrationsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ event: searchParams.get("event") || "", attendance_status: "", search: "" });
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState("");

  const events = useFetch(() => (user.role === "volunteer" ? eventService.assigned() : eventService.list()), [user.role]);
  const { data, loading, error, reload } = useFetch(
    () => registrationService.list(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const confirmDelete = async () => {
    try {
      await registrationService.remove(deleting.id);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="page-header"><h2>{user.role === "admin" ? "Registrations" : "Participants"}</h2></div>
      <div className="filters">
        <input name="search" placeholder="Search name, email or registration ID" value={filters.search} onChange={handleChange} />
        <select name="event" value={filters.event} onChange={handleChange}>
          <option value="">All events</option>
          {events.data?.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select name="attendance_status" value={filters.attendance_status} onChange={handleChange}>
          <option value="">All attendance</option>
          <option>Checked In</option>
          <option>Not Checked In</option>
        </select>
      </div>
      <ErrorMessage message={actionError || error} onRetry={error ? reload : undefined} />
      {loading && <Loader />}
      {!loading && data?.length === 0 && <EmptyState title="No registrations found" />}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Registration ID</th><th>Student</th><th>Event</th><th>Status</th><th>Attendance</th><th>Checked in</th>{user.role === "admin" && <th />}</tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td data-label="ID"><strong>{r.registration_id}</strong></td>
                  <td data-label="Student">{r.student_name}<div className="muted small">{r.student_email}</div></td>
                  <td data-label="Event">{r.event_title}</td>
                  <td data-label="Status"><StatusBadge value={r.status} /></td>
                  <td data-label="Attendance"><StatusBadge value={r.attendance_status} /></td>
                  <td data-label="Checked in">
                    {r.check_in_time ? <>{formatDateTime(r.check_in_time)}<div className="muted small">by {r.checked_in_by_name}</div></> : "-"}
                  </td>
                  {user.role === "admin" && (
                    <td><button className="btn btn-sm btn-danger" onClick={() => setDeleting(r)}>Delete</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete registration ${deleting.registration_id}?`} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
