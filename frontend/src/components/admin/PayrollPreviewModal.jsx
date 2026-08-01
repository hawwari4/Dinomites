import { useEffect, useState } from 'react'
import { Loader2, BadgeDollarSign } from 'lucide-react'
import Modal from '../common/Modal'
import { automationApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

export default function PayrollPreviewModal({ eligibleIds, onClose, onRun }) {
  const toast = useToast()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    automationApi.payrollPreview().then(setPreview).finally(() => setLoading(false))
  }, [])

  const confirm = async () => {
    if (!eligibleIds.length) { toast('No onboarding QSTP interns to process', 'warn'); return }
    setRunning(true)
    try {
      await automationApi.run('payroll', eligibleIds)
      toast(`Payroll processed for ${eligibleIds.length} intern${eligibleIds.length === 1 ? '' : 's'}`, 'success')
      onRun()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not run payroll', 'error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Modal
      title="QSTP Payroll Run"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button
            onClick={confirm}
            disabled={running || loading}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeDollarSign className="w-4 h-4" />}
            Confirm &amp; Run Payroll
          </button>
        </>
      }
    >
      {loading || !preview ? (
        <div className="text-sm text-slate-500 py-6 text-center">Loading payroll breakdown…</div>
      ) : preview.startups.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center">No active interns to process payroll for.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {preview.ratePerHour} QR/hour for QSTP-funded interns · Work Placement interns are unpaid.
          </p>
          {preview.startups.map((s) => (
            <div key={s.startupId} className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{s.startupName}</span>
                <span className="text-sm font-bold text-qstp-700">{s.startupTotal.toLocaleString()} QR/wk</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="text-left font-medium px-4 py-1.5">Intern</th>
                      <th className="text-left font-medium px-4 py-1.5">Track</th>
                      <th className="text-right font-medium px-4 py-1.5">Hrs/wk</th>
                      <th className="text-right font-medium px-4 py-1.5">Rate</th>
                      <th className="text-right font-medium px-4 py-1.5">Cost/wk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.interns.map((i) => (
                      <tr key={i.candidateId} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-1.5 text-slate-800">{i.name}</td>
                        <td className="px-4 py-1.5 text-slate-500">{i.track === 'qstp' ? 'QSTP Funded' : 'Work Placement'}</td>
                        <td className="px-4 py-1.5 text-right text-slate-700">{i.weeklyHours}</td>
                        <td className="px-4 py-1.5 text-right text-slate-700">{i.hourlyRate} QR</td>
                        <td className="px-4 py-1.5 text-right font-semibold text-slate-900">{i.weeklyCost.toLocaleString()} QR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Total Weekly Cost</span>
            <span className="text-xl font-extrabold text-qstp-700">{preview.grandTotal.toLocaleString()} QR</span>
          </div>
        </div>
      )}
    </Modal>
  )
}
