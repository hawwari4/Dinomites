export default function StartupLoad({ startups, onSelect }) {
  return (
    <div className="mt-3 space-y-2">
      {(startups || []).map((s) => {
        const barColor = s.qstpCohortsUsed >= 3 ? 'bg-rose-500' : s.qstpCohortsUsed === 2 ? 'bg-amber-500' : 'bg-qstp-500'
        return (
          <div key={s.id} className="border border-slate-100 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-qstp-100 text-qstp-700 grid place-items-center text-xs font-semibold">
              {s.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelect?.(s.id)}
                  className="text-sm font-semibold text-slate-900 truncate hover:underline hover:text-qstp-700 text-left"
                >
                  {s.name}
                  {s.premium && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded ml-1">PREMIUM</span>}
                </button>
                <div className={`text-xs font-semibold ${s.qstpCohortsUsed >= 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                  QSTP {s.qstpCohortsUsed}/3
                </div>
              </div>
              <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
