import { useMemo } from 'react'
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { initials, daysAgoLabel } from '../../utils/helpers'

const RELEVANT = ['matched', 'interviewing', 'onboarding', 'rejected']

export default function DecisionsFeed({ candidates, onSelect, onDelete }) {
  const decisions = useMemo(() => {
    return (candidates || [])
      .filter((c) => RELEVANT.includes(c.status) && c.decidedAt)
      .sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt))
      .slice(0, 8)
  }, [candidates])

  if (!decisions.length) {
    return <div className="text-sm text-slate-500">No startup decisions yet — confirmations and rejections will show up here.</div>
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
      {decisions.map((c) => {
        const rejected = c.status === 'rejected'
        return (
          <div key={c.id} className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-qstp-100 text-qstp-700 grid place-items-center text-xs font-semibold shrink-0">
              {initials(c.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => onSelect?.(c)}
                className="text-sm font-semibold text-slate-900 truncate hover:underline hover:text-qstp-700 text-left block"
              >
                {c.fullName}
              </button>
              <div className="text-xs text-slate-500 truncate">{c.startupName || 'Unassigned'} · {daysAgoLabel(c.decidedAt)}</div>
              {rejected && c.feedback && <div className="text-[11px] text-rose-700 mt-1">"{c.feedback}"</div>}
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0 ${
              rejected ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              {rejected ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {rejected ? 'Rejected' : 'Confirmed'}
            </span>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Remove ${c.fullName} from decisions? This deletes the candidate record.`)) {
                    onDelete(c.id)
                  }
                }}
                title="Delete candidate"
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
