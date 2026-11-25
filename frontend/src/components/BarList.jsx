// A tiny dependency-free horizontal bar chart (Tailwind + inline width).
export default function BarList({ title, rows, labelKey, valueKey, format = (v) => v }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey])), 1);
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row[labelKey]} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm">
            <div className="truncate text-slate-600" title={row[labelKey]}>{row[labelKey]}</div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${(Number(row[valueKey]) / max) * 100}%` }} />
            </div>
            <div className="font-medium text-slate-800">{format(row[valueKey])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
