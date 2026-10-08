// A tiny dependency-free horizontal bar chart (pure CSS widths).
export default function BarList({ title, rows, labelKey, valueKey, format = (v) => v }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey])), 1);
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {rows.length === 0 && <p className="muted">No data yet.</p>}
      {rows.map((row) => (
        <div className="bar-row" key={row[labelKey]}>
          <div className="bar-label" title={row[labelKey]}>{row[labelKey]}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(Number(row[valueKey]) / max) * 100}%` }} />
          </div>
          <div className="bar-value">{format(row[valueKey])}</div>
        </div>
      ))}
    </div>
  );
}
