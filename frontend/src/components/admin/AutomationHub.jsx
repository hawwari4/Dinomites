import { useMemo, useState } from 'react'
import { Mail, FileSignature, BadgeDollarSign } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import EmailComposeModal from './EmailComposeModal'
import PayrollPreviewModal from './PayrollPreviewModal'
import GenerateContractsModal from './GenerateContractsModal'

const ACCEPTED_STATUSES = ['matched', 'interviewing', 'onboarding', 'contract_sent', 'payroll_processed']

const EMAIL_FILTERS = [
  { id: 'accepted', label: 'Accepted interns' },
  { id: 'signed_contracts', label: 'Signed contracts' },
  { id: 'all', label: 'Everyone' },
]

export default function AutomationHub({ candidates, candidateIdsByKind, onRun }) {
  const toast = useToast()
  const [emailFilter, setEmailFilter] = useState('accepted')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [payrollModalOpen, setPayrollModalOpen] = useState(false)
  const [contractsModalOpen, setContractsModalOpen] = useState(false)

  const emailRecipients = useMemo(() => {
    const list = candidates || []
    if (emailFilter === 'signed_contracts') return list.filter((c) => c.contractSignedAt)
    if (emailFilter === 'all') return list
    return list.filter((c) => ACCEPTED_STATUSES.includes(c.status))
  }, [candidates, emailFilter])

  const contractIds = candidateIdsByKind.contracts || []
  const payrollIds = candidateIdsByKind.payroll || []

  const openContracts = () => {
    if (!contractIds.length) { toast('No eligible candidates for this automation', 'warn'); return }
    setContractsModalOpen(true)
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Email recipients</div>
        <div className="flex flex-wrap gap-1.5">
          {EMAIL_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setEmailFilter(f.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                emailFilter === f.id ? 'bg-qstp-500 border-qstp-500 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEmailModalOpen(true)}
          className="mt-2 w-full inline-flex items-center justify-between gap-2 border border-slate-200 hover:bg-slate-50 text-sm px-4 py-2.5 rounded-lg text-slate-700"
        >
          <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-qstp-600" /> Send Mass Email</span>
          <span className="text-[11px] text-slate-500">{emailRecipients.length} recipient{emailRecipients.length === 1 ? '' : 's'}</span>
        </button>
      </div>

      <button
        onClick={openContracts}
        className="w-full inline-flex items-center justify-between gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-sm px-4 py-2.5 rounded-lg text-slate-700"
      >
        <span className="inline-flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-qstp-600" />
          Generate Contracts
        </span>
        <span className="text-[11px] text-slate-500">{contractIds.length} eligible</span>
      </button>

      <button
        onClick={() => setPayrollModalOpen(true)}
        className="w-full inline-flex items-center justify-between gap-2 border border-slate-200 hover:bg-slate-50 text-sm px-4 py-2.5 rounded-lg text-slate-700"
      >
        <span className="inline-flex items-center gap-2"><BadgeDollarSign className="w-4 h-4 text-qstp-600" /> Run QSTP Payroll</span>
        <span className="text-[11px] text-slate-500">{payrollIds.length} eligible</span>
      </button>

      {emailModalOpen && (
        <EmailComposeModal
          recipients={emailRecipients}
          onClose={() => setEmailModalOpen(false)}
          onSent={() => { setEmailModalOpen(false); onRun() }}
        />
      )}
      {payrollModalOpen && (
        <PayrollPreviewModal
          eligibleIds={payrollIds}
          onClose={() => setPayrollModalOpen(false)}
          onRun={() => { setPayrollModalOpen(false); onRun() }}
        />
      )}
      {contractsModalOpen && (
        <GenerateContractsModal
          candidates={candidates}
          eligibleIds={contractIds}
          onClose={() => setContractsModalOpen(false)}
          onSent={() => { setContractsModalOpen(false); onRun() }}
        />
      )}
    </div>
  )
}
