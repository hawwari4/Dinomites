import { useState } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import StartupDetailModal from './StartupDetailModal'

export default function StartupFeed({ startups }) {
  const toast = useToast()
  const [sent, setSent] = useState({})
  const [sending, setSending] = useState(null)
  const [viewing, setViewing] = useState(null)

  const expressInterest = async (s) => {
    setSending(s.id)
    await new Promise((r) => setTimeout(r, 500))
    toast(`Interest sent to ${s.name}`, 'success')
    setSent((prev) => ({ ...prev, [s.id]: true }))
    setSending(null)
  }

  if (!startups?.length) {
    return <div className="text-sm text-slate-500">No startups to match against yet.</div>
  }

  return (
    <div className="space-y-3">
      {startups.map((s) => {
        const cohortsFull = s.qstpCohortsUsed >= 3
        return (
          <div key={s.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-card transition">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <button onClick={() => setViewing(s)} className="flex items-start gap-3 text-left hover:opacity-80 transition">
                <div className="w-10 h-10 rounded-lg bg-qstp-100 text-qstp-700 grid place-items-center font-semibold">
                  {s.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2 hover:underline">
                    {s.name}
                    {s.premium && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">PREMIUM</span>}
                  </div>
                  <div className="text-xs text-slate-500">{s.sector} · {s.location}</div>
                </div>
              </button>
              <div className="text-right">
                <div className={`text-2xl font-extrabold ${s.score >= 85 ? 'text-emerald-600' : s.score >= 70 ? 'text-qstp-600' : 'text-slate-500'}`}>
                  {s.score}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">match</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.needs.map((n) => (
                <span key={n} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{n}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                Track availability:{' '}
                <span className={cohortsFull ? 'text-rose-600 font-semibold' : 'text-qstp-700 font-semibold'}>
                  {cohortsFull ? 'Work Placement only (QSTP 3/3)' : `QSTP ${s.qstpCohortsUsed}/3 · Work Placement`}
                </span>
              </div>
              <button
                onClick={() => expressInterest(s)}
                disabled={sending === s.id || sent[s.id]}
                className="text-xs px-3 py-1.5 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white inline-flex items-center gap-1"
              >
                {sending === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sent[s.id] ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {sent[s.id] ? 'Sent' : 'Express Interest'}
              </button>
            </div>
          </div>
        )
      })}
      {viewing && <StartupDetailModal startup={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
