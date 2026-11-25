import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Pagination from "../components/Pagination";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { userService } from "../services/endpoints";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const debouncedRegId = useDebounce(registrationId, 400);
  useEffect(() => setPage(1), [debouncedSearch, debouncedRegId]);

  const params = useMemo(
    () => Object.fromEntries(Object.entries({ role: "student", search: debouncedSearch, registration_id: debouncedRegId, page, page_size: PAGE_SIZE }).filter(([, v]) => v)),
    [debouncedSearch, debouncedRegId, page]
  );
  const { data, loading, error, reload } = useFetch(() => userService.list(params), [params]);
  const rows = data?.results;

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">Students</h2>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
        <input className="input" placeholder="Registration ID (e.g. ACE-2026-00001)" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} aria-label="Registration ID" />
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && !rows && <Loader />}
      {!loading && rows?.length === 0 && <EmptyState title="No students found" />}
      {rows?.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Roll no.</th><th className="th">Department</th><th className="th">Joined</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{s.full_name}</td>
                  <td className="td">{s.email}</td>
                  <td className="td">{s.roll_number || "-"}</td>
                  <td className="td">{s.department || "-"}</td>
                  <td className="td">{formatDate(s.date_joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
    </>
  );
}
