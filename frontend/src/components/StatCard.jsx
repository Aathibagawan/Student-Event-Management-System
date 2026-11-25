const TONES = {
  blue: "border-l-blue-500",
  green: "border-l-emerald-500",
  orange: "border-l-amber-500",
  purple: "border-l-violet-500",
  gray: "border-l-slate-400",
};

export default function StatCard({ label, value, hint, tone = "blue" }) {
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${TONES[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
