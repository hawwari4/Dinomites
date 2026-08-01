import { useState } from 'react'
import { Lock, Sparkles, UserPlus, Loader2 } from 'lucide-react'
import { TrackChip, CommitChip } from '../common/Chips'
import { initials } from '../../utils/helpers'
import { candidateApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { STARTUP_MATCH_FREE_LIMIT, STARTUP_MATCH_PREMIUM_LIMIT } from '../../utils/constants'
import CandidateModal from './CandidateModal'

export default function InternFeed({ interns, premium, startupId, onAssigned, onUpgrade }) {
  const toast = useToast()
  const [assigning, setAssigning] = useState(null)
  const [viewing, setViewing] = useState(null)

  if (!interns?.length) {
    return <div className="text-sm text-slate-500">No matching interns yet — upload an internship description to improve matches.</div>
  }

  const limit = premium ? STARTUP_MATCH_PREMIUM_LIMIT : STARTUP_MATCH_FREE_LIMIT

  const assign = async (c) => {
    setAssigning(c.id)
    try {
      await candidateApi.assign(c.id, startupId)
      toast(`${c.fullName} added to your 5-Step Workflow Tracker`, 'success')
      onAssigned()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not add candidate', 'error')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] text-slate-500">
        Showing {interns.length} of up to {limit} matches{!premium && ` · Free tier is capped at ${STARTUP_MATCH_FREE_LIMIT}`}
      </div>
      {interns.map((c) => (
        <div key={c.id} className="border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-qstp-100 text-qstp-700 grid place-items-center font-semibold shrink-0">
            {initials(c.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <button onClick={() => setViewing(c)} className="block w-full text-left text-sm font-semibold text-slate-900 truncate hover:underline">{c.fullName}</button>
            <div className="text-xs text-slate-500 truncate">{c.university} · {c.major}</div>
            <div className="mt-1 flex flex-wrap gap-1"><TrackChip track={c.track} /><CommitChip commitment={c.commitment} /></div>
          </div>
          <div className={`text-lg font-extrabold shrink-0 ${c.score >= 85 ? 'text-emerald-600' : c.score >= 70 ? 'text-qstp-600' : 'text-slate-500'}`}>
            {c.score}%
          </div>
          <button
            onClick={() => assign(c)}
            disabled={assigning !== null}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold"
          >
            {assigning === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Add to Workflow
          </button>
        </div>
      ))}

      {!premium && (
        <button
          onClick={onUpgrade}
          className="w-full border-2 border-dashed border-amber-200 bg-amber-50/60 rounded-xl p-4 text-center hover:bg-amber-50 transition"
        >
          <Lock className="w-5 h-5 text-amber-600 mx-auto" />
          <div className="text-sm font-semibold text-amber-800 mt-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Upgrade to Premium for up to {STARTUP_MATCH_PREMIUM_LIMIT} matches
          </div>
        </button>
      )}

      {viewing && (
        <CandidateModal
          candidate={{ ...viewing, match: viewing.match ?? viewing.score }}
          startupId={startupId}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
