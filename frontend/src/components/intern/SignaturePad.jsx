import { useState } from 'react'
import { PenTool } from 'lucide-react'
import Modal from '../common/Modal'
import SignatureCapture from '../common/SignatureCapture'

export default function SignaturePad({ onClose, onConfirm, signing }) {
  const [signatureData, setSignatureData] = useState(null)

  const confirm = () => {
    if (!signatureData) return
    onConfirm(signatureData)
  }

  return (
    <Modal
      title="Sign & Accept Contract"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button
            onClick={confirm}
            disabled={!signatureData || signing}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" />{signing ? 'Signing…' : 'Confirm Signature'}
          </button>
        </>
      }
    >
      <SignatureCapture onCapture={setSignatureData} />
      <p className="text-xs text-slate-500 mt-4">By confirming, you electronically sign this internship agreement. The signature is time-and-date stamped.</p>
    </Modal>
  )
}
