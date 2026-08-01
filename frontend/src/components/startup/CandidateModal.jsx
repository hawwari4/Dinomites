import { useState } from 'react'
import { FileText, Link2, Code2, Send, Loader2 } from 'lucide-react'
import Modal from '../common/Modal'
import { TrackChip, CommitChip, StatusChip } from '../common/Chips'
import { cycleLabel, initials } from '../../utils/helpers'
import { notificationApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

export default function CandidateModal({ candidate, startupId, onClose }) {
  const c = candidate
  const toast = useToast()
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)

  const askQuestion = async () => {
    if (!question.trim()) return
    setSending(true)
    try {
      await notificationApi.send({ candidateId: c.id, startupId, message: question.trim() })
      toast(`Question sent to ${c.fullName}`, 'success')
      setQuestion('')
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not send question', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal title={c.fullName} size="lg" onClose={onClose} footer={
      <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Close</button>
    }>
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-qstp-100 text-qstp-700 grid place-items-center font-semibold">{initials(c.fullName)}</div>
          <div>
            <div className="font-semibold text-slate-900">{c.fullName}</div>
            <div className="text-xs text-slate-500">{c.university} · {c.degree} {c.major}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <TrackChip track={c.track} /><CommitChip commitment={c.commitment} /><StatusChip status={c.status} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <InfoBox label="QID" value={c.qid} mono />
          <InfoBox label="Nationality" value={c.nationality} />
          <InfoBox label="Phone" value={c.phone} />
          <InfoBox label="Email" value={c.email} />
          <InfoBox label="Gender" value={c.gender} />
          <InfoBox label="Grad Year" value={c.gradYear} />
          <InfoBox label="Academic Status" value={c.currentAcademicStatus} />
          <InfoBox label="Cycle" value={cycleLabel(c.cycle)} />
          <InfoBox label="Match" value={`${c.match || '—'}%`} bold />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Skills Set</div>
          <div className="flex flex-wrap gap-1.5">
            {(c.skillSet || []).map((k) => <span key={k} className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5">{k}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <a href={c.cvLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><FileText className="w-3.5 h-3.5" />CV</a>
          <a href={c.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><Link2 className="w-3.5 h-3.5" />LinkedIn</a>
          <a href={c.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><Code2 className="w-3.5 h-3.5" />Portfolio</a>
        </div>

        {(c.howHeard || c.whyInterested || c.additionalComments) && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Application Answers</div>
            <div className="space-y-2">
              {c.howHeard && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">How they heard about QSTP{c.referralOrg ? ` · ${c.referralOrg}` : ''}</div>
                  <div className="text-slate-900">{c.howHeard}</div>
                </div>
              )}
              {c.whyInterested && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">Why they're interested</div>
                  <div className="text-slate-900">{c.whyInterested}</div>
                </div>
              )}
              {c.additionalComments && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">Additional comments</div>
                  <div className="text-slate-900">{c.additionalComments}</div>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded-full border ${c.consentDataPolicy ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {c.consentDataPolicy ? '✓' : '✗'} Data policy consent
              </span>
              <span className={`px-2 py-0.5 rounded-full border ${c.consentMediaRelease ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {c.consentMediaRelease ? '✓' : '✗'} Media release consent
              </span>
              {c.weeklyHours != null && (
                <span className="px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">{c.weeklyHours} hrs/week</span>
              )}
            </div>
          </div>
        )}

        {c.feedback && (
          <div className="text-xs bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-800">
            <div className="font-semibold mb-1">Rejection feedback</div>{c.feedback}
          </div>
        )}

        {startupId && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ask {c.fullName.split(' ')[0]} a Question</div>
            <div className="flex items-start gap-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Are you available to start mid-cycle?"
                rows={2}
                className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus resize-none"
              />
              <button
                onClick={askQuestion}
                disabled={sending || !question.trim()}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function InfoBox({ label, value, mono, bold }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
      <div className="text-slate-500">{label}</div>
      <div className={`text-slate-900 ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : ''}`}>{value}</div>
    </div>
  )
}
