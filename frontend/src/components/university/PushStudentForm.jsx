import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CYCLES } from '../../utils/constants'
import { candidateApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

const EMPTY = { fullName: '', qid: '', nationality: 'Qatari', email: '', phone: '', major: '', commitment: 'PT', cycle: 'winter', skillSet: '' }

export default function PushStudentForm({ universityName, onPushed }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const cand = await candidateApi.push({
        universityName,
        ...form,
        skillSet: form.skillSet.split(',').map((s) => s.trim()).filter(Boolean),
      })
      toast(`Pushed ${cand.fullName} to Work Placement pool`, 'success')
      setForm(EMPTY)
      onPushed()
    } catch {
      toast('Could not push student', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 text-sm">
      <div>
        <label className="text-xs font-medium text-slate-600">Full Name (QID)</label>
        <input required value={form.fullName} onChange={set('fullName')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">QID No</label>
          <input required value={form.qid} onChange={set('qid')} placeholder="28xxxxxxxxx" className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Nationality</label>
          <input required value={form.nationality} onChange={set('nationality')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input required type="email" value={form.email} onChange={set('email')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Phone</label>
          <input required value={form.phone} onChange={set('phone')} placeholder="+974 ..." className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Major</label>
        <input required value={form.major} onChange={set('major')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Availability</label>
          <select value={form.commitment} onChange={set('commitment')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
            <option value="PT">Part-time · 20h</option>
            <option value="FT">Full-time · 40h</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Cycle</label>
          <select value={form.cycle} onChange={set('cycle')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
            {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Skills (comma separated)</label>
        <input required value={form.skillSet} onChange={set('skillSet')} placeholder="Python, React, ..." className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
      </div>
      <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        <Plus className="w-4 h-4" /> {saving ? 'Pushing…' : 'Push to Work Placement Pool'}
      </button>
    </form>
  )
}
