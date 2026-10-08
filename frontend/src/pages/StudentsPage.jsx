import { useState } from "react";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import useFetch from "../hooks/useFetch";
import { userService } from "../services/endpoints";
import { formatDate } from "../utils/format";

export default function StudentsPage() {
  const [filters, setFilters] = useState({ search: "", registration_id: "" });
  const { data, loading, error, reload } = useFetch(
    () => userService.list({ role: "student", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
    [filters]
  );
  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <>
      <div className="page-header"><h2>Students</h2></div>
      <div className="filters">
        <input name="search" placeholder="Search by name or email" value={filters.search} onChange={handleChange} />
        <input name="registration_id" placeholder="Registration ID (e.g. ACE-2026-00001)" value={filters.registration_id} onChange={handleChange} />
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && <Loader />}
      {!loading && data?.length === 0 && <EmptyState title="No students found" />}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Roll no.</th><th>Department</th><th>Joined</th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td data-label="Name">{s.full_name}</td>
                  <td data-label="Email">{s.email}</td>
                  <td data-label="Roll no.">{s.roll_number || "-"}</td>
                  <td data-label="Department">{s.department || "-"}</td>
                  <td data-label="Joined">{formatDate(s.date_joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
