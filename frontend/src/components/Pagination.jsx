/** Server-side pagination controls. `count` = total rows reported by the API. */
export default function Pagination({ page, pageSize, count, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600" aria-label="Pagination">
      <span>Showing {from}–{to} of {count}</span>
      <div className="flex items-center gap-2">
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
      </div>
    </nav>
  );
}
