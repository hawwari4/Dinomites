import { useState } from 'react'
import { UserPlus, Send } from 'lucide-react'
import { byocApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { BYOC_CAP } from '../../utils/constants'

const EMPTY = { fullName: '', email: '', cvLink: '', track: 'placement', commitment: 'PT' }

export default function ByocPanel({ startup, submissions, onSubmitted }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const cohortsFull = startup.qstpCohortsUsed >= 3
  const cap = startup.premium ? BYOC_CAP.premium : BYOC_CAP.free
  const used = (submissions || []).filter((b) => b.status !== 'rejected').length
  const atCap = used >= cap

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await byocApi.submit({ startupId: startup.id, startupName: startup.name, ...form })
      toast('BYOC submitted — awaiting QSTP approval', 'info')
      setForm(EMPTY)
      onSubmitted()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not submit BYOC', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-qstp-600" /> Bring Your Own Candidate</h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${atCap ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-qstp-50 text-qstp-700 border-qstp-100'}`}>
          {used} / {cap} used
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Nominate an external candidate — requires QSTP approval before hire.</p>
      {atCap && (
        <div className="mt-3 w-full text-xs px-3 py-2 rounded-lg border border-dashed border-amber-200 bg-amber-50 text-amber-800 text-center">
          {`BYOC limit reached — you've used all ${cap} nominations for this cycle.`}
        </div>
      )}
      <form onSubmit={submit} className={`mt-3 space-y-3 text-sm ${atCap ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <label className="text-xs font-medium text-slate-600">Candidate Full Name</label>
          <input required value={form.fullName} onChange={set('fullName')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input required type="email" value={form.email} onChange={set('email')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">CV Link</label>
          <input required type="url" value={form.cvLink} onChange={set('cvLink')} placeholder="https://..." className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Track</label>
            <select value={form.track} onChange={set('track')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
              <option value="qstp" disabled={cohortsFull}>QSTP Funded {cohortsFull ? '(3/3)' : ''}</option>
              <option value="placement">Work Placement</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Commitment</label>
            <select value={form.commitment} onChange={set('commitment')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
              <option value="PT">Part-time</option><option value="FT">Full-time</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving || atCap} className="w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Send className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit for QSTP Approval'}
        </button>
      </form>
      <div className="mt-4 space-y-2">
        {!submissions?.length ? (
          <div className="text-[11px] text-slate-400 italic">No BYOC submissions yet.</div>
        ) : (
          submissions.map((b) => (
            <div key={b.id} className="border border-slate-100 rounded-lg p-2.5 text-xs flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">{b.fullName}</div>
                <div className="text-[11px] text-slate-500">{b.email}</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                b.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : b.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {b.status.replaceAll('_', ' ')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
