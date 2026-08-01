import { useMemo, useState } from 'react'
import { Eye, ChevronRight, Check, X } from 'lucide-react'
import { TrackChip, CommitChip } from '../common/Chips'
import { WORKFLOW, QATAR_UNIS } from '../../utils/constants'
import { initials } from '../../utils/helpers'
import { candidateApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import CandidateModal from './CandidateModal'
import RejectModal from './RejectModal'

export default function CandidateList({ candidates, premium, startupId, onChanged }) {
  const toast = useToast()
  const [filters, setFilters] = useState({ name: '', track: '', commit: '', uni: '', gender: '' })
  const [viewing, setViewing] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [busy, setBusy] = useState(null)

  const filtered = useMemo(() => {
    const name = filters.name.toLowerCase()
    return (candidates || []).filter((c) => {
      if (name && !(c.fullName || '').toLowerCase().includes(name)) return false
      if (filters.track && c.track !== filters.track) return false
      if (filters.commit && c.commitment !== filters.commit) return false
      if (filters.uni && c.university !== filters.uni) return false
      if (filters.gender && c.gender !== filters.gender) return false
      return true
    })
  }, [candidates, filters])

  const advance = async (c) => {
    setBusy(c.id)
    try {
      await candidateApi.advance(c.id)
      toast(`${c.fullName} advanced`, 'success')
      onChanged()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not advance candidate', 'error')
    } finally {
      setBusy(null)
    }
  }

  const reject = async (feedback) => {
    try {
      await candidateApi.reject(rejecting.id, feedback)
      toast('Candidate rejected with feedback', 'info')
      setRejecting(null)
      onChanged()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not reject candidate', 'error')
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          placeholder="Search candidate..."
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          className="text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus flex-1 min-w-[180px]"
        />
        <select value={filters.track} onChange={(e) => setFilters((f) => ({ ...f, track: e.target.value }))} className="text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus">
          <option value="">All tracks</option><option value="qstp">QSTP Funded</option><option value="placement">Work Placement</option>
        </select>
        <select value={filters.commit} onChange={(e) => setFilters((f) => ({ ...f, commit: e.target.value }))} className="text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus">
          <option value="">All commitments</option><option value="FT">Full-time</option><option value="PT">Part-time</option>
        </select>
        {premium ? (
          <>
            <select value={filters.uni} onChange={(e) => setFilters((f) => ({ ...f, uni: e.target.value }))} className="text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus">
              <option value="">All universities ★</option>
              {QATAR_UNIS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <select value={filters.gender} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))} className="text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus">
              <option value="">Any gender ★</option><option>Male</option><option>Female</option>
            </select>
          </>
        ) : (
          <span className="text-[11px] text-slate-400 italic">★ Advanced filters require Premium</span>
        )}
      </div>

      <div className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-xl">
        {!filtered.length ? (
          <div className="p-8 text-center text-sm text-slate-500">No candidates match your filters.</div>
        ) : (
          filtered.map((c) => {
            const wIdx = c.workflowIdx ?? 0
            return (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 md:w-1/3">
                  <div className="w-10 h-10 rounded-full bg-qstp-100 text-qstp-700 grid place-items-center font-semibold">{initials(c.fullName)}</div>
                  <div className="min-w-0">
                    <button onClick={() => setViewing(c)} className="block w-full font-semibold text-slate-900 truncate hover:underline text-left">{c.fullName}</button>
                    <div className="text-xs text-slate-500 truncate">{c.university} · {c.major}</div>
                    <div className="mt-1 flex flex-wrap gap-1"><TrackChip track={c.track} /><CommitChip commitment={c.commitment} /></div>
                  </div>
                </div>
                <div className="md:w-1/3">
                  <div className="flex items-center gap-1">
                    {WORKFLOW.map((_, i) => <div key={i} className={`w-6 h-2 rounded-full ${i <= wIdx ? 'bg-qstp-500' : 'bg-slate-200'}`} />)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Step {wIdx + 1}/5 · {WORKFLOW[wIdx]}</div>
                </div>
                <div className="flex items-center gap-2 md:w-1/3 md:justify-end flex-wrap">
                  <div className={`text-sm font-semibold ${(c.match || 0) >= 85 ? 'text-emerald-600' : (c.match || 0) >= 70 ? 'text-qstp-600' : 'text-slate-500'}`}>
                    {c.match ? `${c.match}%` : '—'}
                  </div>
                  <button onClick={() => setViewing(c)} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />View
                  </button>
                  <button
                    onClick={() => advance(c)}
                    disabled={wIdx >= WORKFLOW.length - 1 || busy === c.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-40 disabled:cursor-not-allowed text-white inline-flex items-center gap-1"
                  >
                    {wIdx === 1 ? <><Check className="w-3.5 h-3.5" />Confirm Selection</> : <><ChevronRight className="w-3.5 h-3.5" />Advance</>}
                  </button>
                  <button onClick={() => setRejecting(c)} className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />Reject
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {viewing && <CandidateModal candidate={viewing} startupId={startupId} onClose={() => setViewing(null)} />}
      {rejecting && <RejectModal onClose={() => setRejecting(null)} onConfirm={reject} />}
    </>
  )
}
