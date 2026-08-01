export default function Funnel({ stages }) {
  const safeStages = stages || []
  const max = Math.max(1, ...safeStages.map((s) => s.count))
  return (
    <div className="space-y-3">
      {safeStages.map((s) => (
        <div key={s.status}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="text-slate-500">{s.count}</span>
          </div>
          <div className="mt-1.5 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-qstp-500 rounded-full transition-all"
              style={{ width: `${Math.max(4, (s.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
