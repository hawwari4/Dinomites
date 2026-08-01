import { useState } from 'react'
import Modal from '../common/Modal'
import { QATAR_UNIS, CYCLES } from '../../utils/constants'

const GENDERS = ['Male', 'Female', 'Prefer not to say']
const ACADEMIC_STATUSES = ['Pursuing', 'Graduated within 2 years']

export default function EditProfileModal({ candidate, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: candidate.fullName,
    qid: candidate.qid,
    nationality: candidate.nationality,
    phone: candidate.phone,
    gender: candidate.gender,
    university: candidate.university,
    currentAcademicStatus: candidate.currentAcademicStatus,
    degree: candidate.degree,
    major: candidate.major,
    gradYear: candidate.gradYear,
    commitment: candidate.commitment,
    cycle: candidate.cycle,
    cvLink: candidate.cvLink || '',
    linkedin: candidate.linkedin || '',
    portfolio: candidate.portfolio || '',
    skillSet: (candidate.skillSet || []).join(', '),
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        ...form,
        skillSet: form.skillSet.split(',').map((s) => s.trim()).filter(Boolean),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Edit Official Application"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" onSubmit={(e) => e.preventDefault()}>
        <Field label="Full Name (QID)" value={form.fullName} onChange={set('fullName')} />
        <Field label="QID No" value={form.qid} onChange={set('qid')} />
        <Field label="Nationality" value={form.nationality} onChange={set('nationality')} />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <SelectField label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS} />
        <SelectField label="University (Qatar)" value={form.university} onChange={set('university')} options={QATAR_UNIS} />
        <SelectField label="Academic Status" value={form.currentAcademicStatus} onChange={set('currentAcademicStatus')} options={ACADEMIC_STATUSES} />
        <Field label="Degree" value={form.degree} onChange={set('degree')} />
        <Field label="Major" value={form.major} onChange={set('major')} />
        <Field label="Graduation Year" value={form.gradYear} onChange={set('gradYear')} />
        <div>
          <label className="text-xs font-medium text-slate-600">Availability</label>
          <select value={form.commitment} onChange={set('commitment')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
            <option value="PT">Part-time (20 hrs/wk)</option>
            <option value="FT">Full-time (40 hrs/wk)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Cycle</label>
          <select value={form.cycle} onChange={set('cycle')} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
            {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label} ({c.start.slice(5)} → {c.end.slice(5)})</option>)}
          </select>
        </div>
        <Field label="Public CV Link" value={form.cvLink} onChange={set('cvLink')} />
        <Field label="LinkedIn" value={form.linkedin} onChange={set('linkedin')} />
        <div className="md:col-span-2"><Field label="Portfolio / GitHub" value={form.portfolio} onChange={set('portfolio')} /></div>
        <div className="md:col-span-2"><Field label="Skills Set (comma-separated)" value={form.skillSet} onChange={set('skillSet')} /></div>
      </form>
    </Modal>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
