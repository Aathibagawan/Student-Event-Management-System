import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import EventForm, { EVENT_STATUSES, EVENT_TYPES } from "../components/EventForm";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { eventService } from "../services/endpoints";
import { formatDate, formatMoney, formatTime, getErrorMessage } from "../utils/format";

const PAGE_SIZE = 9;
const SORT_OPTIONS = [
  ["date", "Date (soonest first)"],
  ["-date", "Date (latest first)"],
  ["title", "Title (A–Z)"],
  ["-registered_count", "Most registrations"],
];

export default function EventsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === "admin";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ event_type: "", status: "", date: "" });
  const [ordering, setOrdering] = useState("date");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | "new" | event object
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  // Debounced search: the API is called 400 ms after the user STOPS typing, not on every key.
  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => setPage(1), [debouncedSearch]);

  // useMemo: build the query params only when one of the inputs really changes.
  const params = useMemo(() => {
    const query = { search: debouncedSearch, ...filters, ordering, page, page_size: PAGE_SIZE };
    return Object.fromEntries(Object.entries(query).filter(([, v]) => v !== "" && v !== null));
  }, [debouncedSearch, filters, ordering, page]);

  const { data, loading, error, reload } = useFetch(
    () => (user.role === "volunteer" ? eventService.assigned(params) : eventService.list(params)),
    [params, user.role]
  );
  const events = data?.results;

  // useCallback: stable function identity between renders.
  const handleFilter = useCallback((e) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  }, []);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await eventService.remove(deleting.id);
      toast.success(`"${deleting.title}" deleted.`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{user.role === "volunteer" ? "Assigned Events" : "Events"}</h2>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing("new")}>+ New Event</button>}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" placeholder="Search by title or venue..." value={search}
          onChange={(e) => setSearch(e.target.value)} aria-label="Search events" />
        <select className="input" name="event_type" value={filters.event_type} onChange={handleFilter} aria-label="Filter by type">
          <option value="">All types</option>
          {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input" name="status" value={filters.status} onChange={handleFilter} aria-label="Filter by status">
          <option value="">All statuses</option>
          {EVENT_STATUSES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={ordering} onChange={(e) => { setOrdering(e.target.value); setPage(1); }} aria-label="Sort events">
          {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !events && <Loader />}
      {!loading && events?.length === 0 && <EmptyState title="No events found" text="Try changing the search or filters." />}

      <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${loading && events ? "opacity-60" : ""}`}>
        {events?.map((ev) => (
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={ev.id}>
            {ev.poster ? (
              <img src={ev.poster} alt={`${ev.title} poster`} loading="lazy" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-5xl font-bold text-white/80">
                {ev.title.charAt(0)}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{ev.event_type}</span>
                <StatusBadge value={ev.status} />
              </div>
              <h3 className="text-lg font-semibold"><Link className="hover:text-indigo-600" to={`/events/${ev.id}`}>{ev.title}</Link></h3>
              <p className="text-sm text-slate-500">📅 {formatDate(ev.date)} · {formatTime(ev.start_time)}</p>
              <p className="text-sm text-slate-500">📍 {ev.venue}</p>
              <p className="text-sm">{ev.registered_count}/{ev.max_participants} registered · {Number(ev.registration_fee) ? formatMoney(ev.registration_fee) : "Free"}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
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
          </div>
        ))}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />

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
