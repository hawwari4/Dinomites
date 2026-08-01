import { useState } from 'react'
import Modal from '../common/Modal'

export default function RejectModal({ onClose, onConfirm }) {
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    if (!feedback.trim()) { setError('Please provide feedback before rejecting.'); return }
    setSaving(true)
    try {
      await onConfirm(feedback.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Reject candidate" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
        <button onClick={confirm} disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold">
          {saving ? 'Rejecting…' : 'Confirm Rejection'}
        </button>
      </>
    }>
      <p className="text-sm text-slate-600">Feedback is mandatory — it helps interns grow.</p>
      <label className="text-xs font-medium text-slate-600 mt-4 block">Feedback</label>
      <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm" />
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </Modal>
  )
}
