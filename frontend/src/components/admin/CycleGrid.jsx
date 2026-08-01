export default function CycleGrid({ cycles }) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {(cycles || []).map((c) => (
        <div key={c.id} className="border border-slate-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">{c.label} 2026</div>
            <span className="text-[11px] font-semibold bg-qstp-50 text-qstp-700 border border-qstp-100 px-2 py-0.5 rounded-full">12 weeks</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{c.start} → {c.end}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[10px] uppercase text-slate-500">QSTP Funded</div>
              <div className="text-lg font-bold text-qstp-700">{c.qstp}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[10px] uppercase text-slate-500">Work Placement</div>
              <div className="text-lg font-bold text-purple-700">{c.placement}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
