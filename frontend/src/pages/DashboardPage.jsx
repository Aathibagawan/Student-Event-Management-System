import BarList from "../components/BarList";
import { ErrorMessage, Loader } from "../components/Feedback";
import StatCard from "../components/StatCard";
import useFetch from "../hooks/useFetch";
import { dashboardService } from "../services/endpoints";
import { formatMoney } from "../utils/format";

function AdminDashboard({ s }) {
  return (
    <>
      <div className="stats-grid">
        <StatCard label="Total Events" value={s.total_events} />
        <StatCard label="Upcoming Events" value={s.upcoming_events} tone="green" />
        <StatCard label="Total Students" value={s.total_students} tone="purple" />
        <StatCard label="Registrations" value={s.total_registrations} />
        <StatCard label="Checked In" value={s.total_checked_in} tone="green" />
        <StatCard label="Pending Check-Ins" value={s.pending_check_ins} tone="orange" />
        <StatCard label="Total Budget" value={formatMoney(s.total_budget)} />
        <StatCard label="Total Expenses" value={formatMoney(s.total_expenses)} tone="orange" />
        <StatCard label="Remaining Budget" value={formatMoney(s.remaining_budget)} tone="green" />
      </div>
      <div className="grid-2 gap">
        <BarList title="Registrations per event" rows={s.registrations_per_event} labelKey="title" valueKey="count" />
        <BarList title="Expenses by category" rows={s.expenses_by_category} labelKey="category" valueKey="total" format={formatMoney} />
      </div>
    </>
  );
}

const StudentDashboard = ({ s }) => (
  <div className="stats-grid">
    <StatCard label="Registered Events" value={s.registered_events} />
    <StatCard label="Upcoming Events" value={s.upcoming_events} tone="green" />
    <StatCard label="Completed Events" value={s.completed_events} tone="gray" />
    <StatCard label="Attended (Checked In)" value={s.attended} tone="green" />
    <StatCard label="Not Yet Checked In" value={s.not_attended} tone="orange" />
  </div>
);

const VolunteerDashboard = ({ s }) => (
  <div className="stats-grid">
    <StatCard label="Assigned Events" value={s.assigned_events} />
    <StatCard label="Total Participants" value={s.total_participants} tone="purple" />
    <StatCard label="Checked-In" value={s.checked_in_participants} tone="green" />
    <StatCard label="Pending Check-Ins" value={s.pending_check_ins} tone="orange" />
  </div>
);

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(dashboardService.get);
  return (
    <>
      <div className="page-header"><h2>Dashboard</h2></div>
      {loading && <Loader />}
      <ErrorMessage message={error} onRetry={reload} />
      {data?.role === "admin" && <AdminDashboard s={data.stats} />}
      {data?.role === "student" && <StudentDashboard s={data.stats} />}
      {data?.role === "volunteer" && <VolunteerDashboard s={data.stats} />}
    </>
  );
}
