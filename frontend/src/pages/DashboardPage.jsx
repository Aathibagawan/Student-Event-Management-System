import BarList from "../components/BarList";
import { ErrorMessage, Loader } from "../components/Feedback";
import StatCard from "../components/StatCard";
import useFetch from "../hooks/useFetch";
import { dashboardService } from "../services/endpoints";
import { formatDate, formatMoney } from "../utils/format";

const Grid = ({ children }) => <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;

// Data from /api/dashboard/event-report/ - a plain SQL query with JOINs and GROUP BY.
function EventReport() {
  const { data, loading, error } = useFetch(dashboardService.eventReport, []);
  if (loading) return null;
  if (error || !data?.length) return null;
  return (
    <div className="card">
      <h3 className="card-title">Event report <span className="text-xs font-normal text-slate-400">(SQL JOIN query)</span></h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead><tr><th className="th">Event</th><th className="th">Date</th><th className="th">Registered</th><th className="th">Fill %</th><th className="th">Attended</th><th className="th">Budget</th><th className="th">Spent</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((r) => (
              <tr key={r.id}>
                <td className="td font-medium">{r.title}</td>
                <td className="td">{formatDate(r.date)}</td>
                <td className="td">{r.registered}/{r.max_participants}</td>
                <td className="td">{r.fill_percent}%</td>
                <td className="td">{r.attended}</td>
                <td className="td">{formatMoney(r.budget)}</td>
                <td className="td">{formatMoney(r.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboard({ s }) {
  return (
    <>
      <Grid>
        <StatCard label="Total Events" value={s.total_events} />
        <StatCard label="Upcoming Events" value={s.upcoming_events} tone="green" />
        <StatCard label="Total Students" value={s.total_students} tone="purple" />
        <StatCard label="Registrations" value={s.total_registrations} />
        <StatCard label="Checked In" value={s.total_checked_in} tone="green" />
        <StatCard label="Pending Check-Ins" value={s.pending_check_ins} tone="orange" />
        <StatCard label="Total Budget" value={formatMoney(s.total_budget)} />
        <StatCard label="Total Expenses" value={formatMoney(s.total_expenses)} tone="orange" />
        <StatCard label="Remaining Budget" value={formatMoney(s.remaining_budget)} tone="green" />
      </Grid>
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <BarList title="Registrations per event" rows={s.registrations_per_event} labelKey="title" valueKey="count" />
        <BarList title="Expenses by category" rows={s.expenses_by_category} labelKey="category" valueKey="total" format={formatMoney} />
      </div>
      <EventReport />
    </>
  );
}

const StudentDashboard = ({ s }) => (
  <Grid>
    <StatCard label="Registered Events" value={s.registered_events} />
    <StatCard label="Upcoming Events" value={s.upcoming_events} tone="green" />
    <StatCard label="Completed Events" value={s.completed_events} tone="gray" />
    <StatCard label="Attended (Checked In)" value={s.attended} tone="green" />
    <StatCard label="Not Yet Checked In" value={s.not_attended} tone="orange" />
  </Grid>
);

const VolunteerDashboard = ({ s }) => (
  <Grid>
    <StatCard label="Assigned Events" value={s.assigned_events} />
    <StatCard label="Total Participants" value={s.total_participants} tone="purple" />
    <StatCard label="Checked-In" value={s.checked_in_participants} tone="green" />
    <StatCard label="Pending Check-Ins" value={s.pending_check_ins} tone="orange" />
  </Grid>
);

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(dashboardService.get);
  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">Dashboard</h2>
      {loading && <Loader />}
      <ErrorMessage message={error} onRetry={reload} />
      {data?.role === "admin" && <AdminDashboard s={data.stats} />}
      {data?.role === "student" && <StudentDashboard s={data.stats} />}
      {data?.role === "volunteer" && <VolunteerDashboard s={data.stats} />}
    </>
  );
}
