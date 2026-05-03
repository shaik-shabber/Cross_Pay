const accentMap = {
  brand: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({
  label,
  value,
  accent = "brand",
  hint,
  trend,
  icon,
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${
            accentMap[accent] || accentMap.brand
          }`}
        >
          {icon || label.charAt(0)}
        </div>
        {trend ? <p className="text-sm font-semibold text-emerald-500">{trend}</p> : null}
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl md:text-2xl font-extrabold text-ink truncate">
      {value}
      </p>
      {hint ? <p className="mt-2 text-sm font-medium text-slate-500">{hint}</p> : null}
    </div>
  );
}
