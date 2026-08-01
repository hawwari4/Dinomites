import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { TrackChip, StatusChip } from '../common/Chips'
import { daysAgoLabel } from '../../utils/helpers'
import { byocApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

export default function ByocQueue({ submissions, onChanged }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  const approve = async (id) => {
    setBusy(id)
    try {
      await byocApi.approve(id)
      toast('BYOC approved — candidate created', 'success')
      onChanged()
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id) => {
    setBusy(id)
    try {
      await byocApi.reject(id)
      toast('BYOC rejected', 'info')
      onChanged()
    } finally {
      setBusy(null)
    }
  }

  if (!submissions?.length) {
    return <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">No BYOC submissions yet.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500 border-b border-slate-100">
            <th className="py-2 pr-2">Candidate</th><th className="py-2 pr-2">Startup</th><th className="py-2 pr-2">Track</th>
            <th className="py-2 pr-2">Submitted</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((b) => (
            <tr key={b.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-2">
                <div className="font-semibold text-slate-900">{b.fullName}</div>
                <div className="text-[11px] text-slate-500">{b.email}</div>
              </td>
              <td className="py-3 pr-2 text-slate-700">{b.startupName}</td>
              <td className="py-3 pr-2"><TrackChip track={b.track} /></td>
              <td className="py-3 pr-2 text-xs text-slate-500">{daysAgoLabel(b.submittedAt)}</td>
              <td className="py-3 pr-2"><StatusChip status={b.status} /></td>
              <td className="py-3 pr-2 text-right">
                {b.status === 'pending_qstp_approval' ? (
                  <div className="inline-flex gap-1">
                    <button onClick={() => approve(b.id)} disabled={busy === b.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />Approve
                    </button>
                    <button onClick={() => reject(b.id)} disabled={busy === b.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60 inline-flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />Reject
                    </button>
                  </div>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
