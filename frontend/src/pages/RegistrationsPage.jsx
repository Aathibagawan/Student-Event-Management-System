import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { eventService, registrationService } from "../services/endpoints";
import { formatDateTime, getErrorMessage } from "../utils/format";

const PAGE_SIZE = 10;

export default function RegistrationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ event: searchParams.get("event") || "", attendance_status: "" });
  const [ordering, setOrdering] = useState("-registered_at");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => setPage(1), [debouncedSearch]);

  const events = useFetch(() => (user.role === "volunteer" ? eventService.allAssigned() : eventService.all()), [user.role]);
  const params = useMemo(
    () => Object.fromEntries(Object.entries({ search: debouncedSearch, ...filters, ordering, page, page_size: PAGE_SIZE }).filter(([, v]) => v)),
    [debouncedSearch, filters, ordering, page]
  );
  const { data, loading, error, reload } = useFetch(() => registrationService.list(params), [params]);
  const rows = data?.results;

  const setFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const confirmDelete = async () => {
    try {
      await registrationService.remove(deleting.id);
      toast.success("Registration deleted.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setDeleting(null);
  };

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">{user.role === "admin" ? "Registrations" : "Participants"}</h2>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" placeholder="Search name, email or ID..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search registrations" />
        <select className="input" name="event" value={filters.event} onChange={setFilter} aria-label="Filter by event">
          <option value="">All events</option>
          {events.data?.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select className="input" name="attendance_status" value={filters.attendance_status} onChange={setFilter} aria-label="Filter by attendance">
          <option value="">All attendance</option>
          <option>Checked In</option>
          <option>Not Checked In</option>
        </select>
        <select className="input" value={ordering} onChange={(e) => { setOrdering(e.target.value); setPage(1); }} aria-label="Sort">
          <option value="-registered_at">Newest first</option>
          <option value="registered_at">Oldest first</option>
        </select>
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && !rows && <Loader />}
      {!loading && rows?.length === 0 && <EmptyState title="No registrations found" />}
      {rows?.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr><th className="th">Registration ID</th><th className="th">Student</th><th className="th">Event</th><th className="th">Status</th><th className="th">Attendance</th><th className="th">Checked in</th>{user.role === "admin" && <th className="th" />}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{r.registration_id}</td>
                  <td className="td">{r.student_name}<div className="text-xs text-slate-400">{r.student_email}</div></td>
                  <td className="td">{r.event_title}</td>
                  <td className="td"><StatusBadge value={r.status} /></td>
                  <td className="td"><StatusBadge value={r.attendance_status} /></td>
                  <td className="td">{r.check_in_time ? <>{formatDateTime(r.check_in_time)}<div className="text-xs text-slate-400">by {r.checked_in_by_name}</div></> : "-"}</td>
                  {user.role === "admin" && <td className="td"><button className="btn btn-sm btn-danger" onClick={() => setDeleting(r)}>Delete</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
      {deleting && <ConfirmDialog message={`Delete registration ${deleting.registration_id}?`} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
