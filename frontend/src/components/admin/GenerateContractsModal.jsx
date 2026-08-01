import { useMemo, useState } from 'react'
import { Loader2, Send, Eye } from 'lucide-react'
import Modal from '../common/Modal'
import SignatureCapture from '../common/SignatureCapture'
import ContractDocument from '../common/ContractDocument'
import { automationApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { initials, daysAgo } from '../../utils/helpers'

function draftContractFor(candidate) {
  return {
    id: 'DRAFT',
    candidateName: candidate.fullName,
    track: candidate.track,
    startup: candidate.startupName,
    cycle: candidate.cycle,
    commitment: candidate.commitment,
    weeks: 12,
    sentAt: new Date().toISOString(),
    startupSignedAt: candidate.decidedAt || new Date().toISOString(),
    signed: false,
    signatureData: null,
  }
}

export default function GenerateContractsModal({ candidates, eligibleIds, onClose, onSent }) {
  const toast = useToast()
  const eligible = useMemo(
    () => (candidates || []).filter((c) => eligibleIds.includes(c.id)),
    [candidates, eligibleIds],
  )
  const [selected, setSelected] = useState(() => new Set(eligibleIds))
  const [signatureData, setSignatureData] = useState(null)
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(null)

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.size === eligible.length ? new Set() : new Set(eligible.map((c) => c.id))))
  }

  const send = async () => {
    if (!selected.size) { toast('Select at least one candidate', 'warn'); return }
    if (!signatureData) { toast('Add your signature first', 'warn'); return }
    setSending(true)
    try {
      await automationApi.run('contracts', Array.from(selected), { signatureData })
      toast(`Contracts sent to ${selected.size} candidate${selected.size === 1 ? '' : 's'}`, 'success')
      onSent()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not send contracts', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      title="Generate Contracts"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button
            onClick={send}
            disabled={sending || !selected.size || !signatureData}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to {selected.size}
          </button>
        </>
      }
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recent Startup Decisions — select candidates</div>
          {eligible.length > 0 && (
            <button onClick={toggleAll} className="text-[11px] font-medium text-qstp-700 hover:underline">
              {selected.size === eligible.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
        {!eligible.length ? (
          <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            No candidates are currently eligible for a contract.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl max-h-56 overflow-y-auto">
            {eligible.map((c) => (
              <label key={c.id} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-qstp-600 ring-focus"
                />
                <div className="w-8 h-8 rounded-full bg-qstp-100 text-qstp-700 grid place-items-center text-[11px] font-semibold shrink-0">
                  {initials(c.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">{c.fullName}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {c.startupName || 'Unassigned'}{c.decidedAt ? ` · confirmed ${daysAgo(c.decidedAt)}d ago` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPreviewing(c) }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1 text-slate-600 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />Preview
                </button>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">QSTP Admin signature</div>
        <SignatureCapture onCapture={setSignatureData} height={130} />
        <p className="text-xs text-slate-500 mt-3">
          This signature is applied to every contract sent in this batch. Once sent, each candidate is notified and can review &amp; sign in their Contract Hub.
        </p>
      </div>

      {previewing && (
        <Modal title={`Preview — ${previewing.fullName}`} size="lg" onClose={() => setPreviewing(null)} footer={
          <button onClick={() => setPreviewing(null)} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Close</button>
        }>
          <ContractDocument
            contract={draftContractFor(previewing)}
            qstpSignatureOverride={signatureData}
            qstpSignedAtOverride={signatureData ? new Date().toISOString() : null}
          />
          {!signatureData && (
            <p className="text-xs text-amber-600 mt-3">Add your signature below to see it reflected on the contract before sending.</p>
          )}
        </Modal>
      )}
    </Modal>
  )
}
