import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import Modal from '../common/Modal'
import { PREMIUM_PRICE, STARTUP_MATCH_PREMIUM_LIMIT, STARTUP_MATCH_FREE_LIMIT } from '../../utils/constants'
import { startupApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

const FEATURES = [
  `See up to ${STARTUP_MATCH_PREMIUM_LIMIT} AI-matched interns instead of ${STARTUP_MATCH_FREE_LIMIT}`,
  'Advanced applicant filters — university & gender',
  'Priority match scoring',
]

export default function PremiumModal({ startup, onClose, onUpgraded }) {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  const confirm = async () => {
    setConfirming(true)
    try {
      await startupApi.update(startup.id, { premium: true })
      toast('Premium activated — enjoy the unlocked features', 'success')
      onUpgraded()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not activate premium', 'error')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      title="Upgrade to Premium"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Not now</button>
          <button
            onClick={confirm}
            disabled={confirming}
            className="text-sm px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> {confirming ? 'Activating…' : 'Confirm Upgrade'}
          </button>
        </>
      }
    >
      <div className="text-center">
        <div className="text-3xl font-extrabold text-slate-900">
          ${PREMIUM_PRICE}<span className="text-sm font-medium text-slate-500">/month</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Cancel anytime — this is a demo checkout, no real payment is taken.</p>
      </div>
      <ul className="mt-5 space-y-2.5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {f}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
