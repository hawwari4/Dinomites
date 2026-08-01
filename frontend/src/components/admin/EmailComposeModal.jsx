import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import Modal from '../common/Modal'
import { automationApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

export default function EmailComposeModal({ recipients, onClose, onSent }) {
  const toast = useToast()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!recipients.length) { toast('No recipients match this filter', 'warn'); return }
    if (!subject.trim() || !body.trim()) { toast('Write a subject and message first', 'error'); return }
    setSending(true)
    try {
      await automationApi.run('mass_email', recipients.map((c) => c.id), { subject: subject.trim(), body: body.trim() })
      toast(`Email sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`, 'success')
      onSent()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not send email', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      title="Compose Email"
      size="md"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button
            onClick={send}
            disabled={sending}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to {recipients.length}
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-500">
        This goes to <span className="font-semibold text-slate-700">{recipients.length}</span> recipient{recipients.length === 1 ? '' : 's'} matching the selected filter.
      </p>
      <div className="mt-3">
        <label className="text-xs font-medium text-slate-600">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Next steps for your QSTP internship"
          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm"
        />
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-slate-600">Message</label>
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm"
        />
      </div>
      {recipients.length > 0 && (
        <div className="mt-3 text-[11px] text-slate-400">
          {recipients.slice(0, 6).map((c) => c.fullName).join(', ')}
          {recipients.length > 6 ? ` +${recipients.length - 6} more` : ''}
        </div>
      )}
    </Modal>
  )
}
