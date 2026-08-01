import { useState } from 'react'
import { Eye, PenTool, Check } from 'lucide-react'
import Modal from '../common/Modal'
import SignaturePad from './SignaturePad'
import ContractDocument from '../common/ContractDocument'
import { TrackChip } from '../common/Chips'
import { TRACKS } from '../../utils/constants'
import { cycleLabel } from '../../utils/helpers'
import { contractApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

const STAGES = ['Draft', 'Startup Signed', 'Intern Signed', 'Executed']

function stageIdx(k) {
  if (k.signed) return 3 // Intern Signed + Executed happen in the same action
  if (k.startupSignedAt) return 1
  return 0
}

function ContractTimeline({ contract }) {
  const idx = stageIdx(contract)
  return (
    <div className="flex items-center mt-3">
      {STAGES.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-5 h-5 rounded-full grid place-items-center text-[9px] font-bold ${i <= idx ? 'bg-qstp-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
              {i < idx || (i === idx && idx === 3) ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <div className={`text-[9px] mt-1 text-center leading-tight ${i <= idx ? 'text-qstp-700 font-medium' : 'text-slate-400'}`}>{label}</div>
          </div>
          {i < STAGES.length - 1 && <div className={`step-line mx-1.5 ${i < idx ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

export default function ContractHub({ contracts, onSigned }) {
  const toast = useToast()
  const [viewing, setViewing] = useState(null)
  const [signingFor, setSigningFor] = useState(null)
  const [signing, setSigning] = useState(false)

  const sign = async (signatureData) => {
    setSigning(true)
    try {
      await contractApi.sign(signingFor.id, signatureData)
      toast('Contract executed — Startup & QSTP Admin notified. Welcome aboard!', 'success')
      setSigningFor(null)
      onSigned()
    } catch {
      toast('Could not sign contract', 'error')
    } finally {
      setSigning(false)
    }
  }

  if (!contracts?.length) {
    return (
      <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
        No contracts yet. Once QSTP or your startup issues one, it will appear here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contracts.map((k) => (
        <div key={k.id} className="border border-slate-100 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <TrackChip track={k.track} />
              <div className="text-sm font-semibold text-slate-900 mt-1">Contract {k.id}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {k.startup} · {cycleLabel(k.cycle)} · {k.weeks} weeks · {k.commitment === 'FT' ? '40h/wk' : '20h/wk'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Contracted by <span className="font-semibold">{TRACKS[k.track].contractedBy}</span> · {TRACKS[k.track].payroll ? 'QSTP payroll' : 'Academic credit only'}
              </div>
            </div>
            {k.signed ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Check className="w-3 h-3" />Executed
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Awaiting Your Signature</span>
            )}
          </div>

          <ContractTimeline contract={k} />

          {k.signed && k.signatureData && (
            <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
              <img src={k.signatureData} alt="Signature" className="h-8 object-contain bg-white rounded border border-slate-100 px-1" />
              <div className="text-[10px] text-slate-500">
                Signed {k.signedAt ? new Date(k.signedAt).toLocaleString() : ''}
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setViewing(k)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />View Contract
            </button>
            {!k.signed && (
              <button
                onClick={() => setSigningFor(k)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1"
              >
                <PenTool className="w-3.5 h-3.5" />Sign &amp; Accept
              </button>
            )}
          </div>
        </div>
      ))}

      {viewing && (
        <Modal title={`Contract ${viewing.id}`} size="lg" onClose={() => setViewing(null)} footer={
          !viewing.signed ? (
            <button
              onClick={() => { setSigningFor(viewing); setViewing(null) }}
              className="text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />Sign &amp; Accept
            </button>
          ) : (
            <button onClick={() => setViewing(null)} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Close</button>
          )
        }>
          <ContractDocument contract={viewing} />
        </Modal>
      )}

      {signingFor && (
        <SignaturePad onClose={() => setSigningFor(null)} onConfirm={sign} signing={signing} />
      )}
    </div>
  )
}
