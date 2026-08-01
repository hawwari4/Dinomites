import { Check } from 'lucide-react'
import { TRACKS } from '../../utils/constants'
import { cycleLabel } from '../../utils/helpers'

function SignatureBlock({ label, signedAt, signatureData, pending = 'Pending signature' }) {
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="h-14 border-b border-slate-300 flex items-end justify-center pb-1">
        {signatureData ? (
          <img src={signatureData} alt={`${label} signature`} className="max-h-12 object-contain" />
        ) : signedAt ? (
          <span className="text-[11px] text-slate-400 italic">signed electronically</span>
        ) : (
          <span className="text-[11px] text-slate-300 italic">{pending}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1">
        {signedAt && <Check className="w-3 h-3 text-emerald-600" />}
        <div className="text-[11px] font-semibold text-slate-700 text-center">{label}</div>
      </div>
      <div className="text-[10px] text-slate-400 text-center">
        {signedAt ? new Date(signedAt).toLocaleDateString() : '—'}
      </div>
    </div>
  )
}

export default function ContractDocument({ contract, qstpSignatureOverride, qstpSignedAtOverride }) {
  const track = TRACKS[contract.track] || TRACKS.qstp
  const qstpSignature = qstpSignatureOverride ?? contract.qstpSignatureData
  const qstpSignedAt = qstpSignature ? (qstpSignedAtOverride ?? contract.sentAt) : null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 font-serif text-slate-800">
      <div className="text-center border-b border-slate-200 pb-4 mb-5">
        <div className="text-[11px] tracking-widest font-sans font-semibold text-qstp-700 uppercase">
          Qatar Science &amp; Technology Park
        </div>
        <div className="text-lg font-bold mt-1">Internship Placement Contract</div>
        <div className="text-[11px] text-slate-400 font-sans mt-1">Contract {contract.id}</div>
      </div>

      <p className="text-sm leading-relaxed">
        This Internship Placement Contract (&ldquo;Agreement&rdquo;) is entered into by and between the
        parties named below, effective as of the date signed, and is administered by the Qatar Science
        &amp; Technology Park (&ldquo;QSTP&rdquo;).
      </p>

      <div className="mt-5">
        <div className="text-xs font-sans font-bold uppercase tracking-wide text-slate-500 mb-1.5">1. Parties</div>
        <div className="text-sm space-y-1">
          <div><span className="text-slate-500">Host Startup:</span> <b>{contract.startup || 'Unassigned'}</b></div>
          <div><span className="text-slate-500">Intern:</span> <b>{contract.candidateName}</b></div>
          <div><span className="text-slate-500">Contracted by:</span> <b>{track.contractedBy}</b></div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-sans font-bold uppercase tracking-wide text-slate-500 mb-1.5">2. Placement Details</div>
        <div className="text-sm space-y-1">
          <div><span className="text-slate-500">Track:</span> <b>{track.label}</b></div>
          <div><span className="text-slate-500">Cycle:</span> <b>{cycleLabel(contract.cycle)}</b></div>
          <div><span className="text-slate-500">Commitment:</span> <b>{contract.commitment === 'FT' ? 'Full-time (40 hrs/week)' : 'Part-time (20 hrs/week)'}</b></div>
          <div><span className="text-slate-500">Duration:</span> <b>{contract.weeks} weeks</b></div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-sans font-bold uppercase tracking-wide text-slate-500 mb-1.5">3. Terms</div>
        <ol className="text-sm space-y-1.5 list-decimal list-inside text-slate-700">
          <li>The Intern will perform duties assigned by the Host Startup in accordance with the role description shared during matching.</li>
          <li>The Host Startup agrees to provide supervision, a safe working environment, and timely feedback throughout the placement.</li>
          <li>QSTP oversees the placement and may be contacted to resolve disputes between the Intern and the Host Startup.</li>
          <li>
            {track.payroll
              ? 'Compensation and payroll are administered by Qatar Science & Technology Park.'
              : 'This is an unpaid academic placement fulfilling university requirements. No monetary compensation is provided.'}
          </li>
          <li>This Agreement may be terminated by either party with written notice to QSTP, consistent with program policy.</li>
        </ol>
      </div>

      <div className="mt-5">
        <div className="text-xs font-sans font-bold uppercase tracking-wide text-slate-500 mb-1.5">4. Confidentiality</div>
        <p className="text-sm text-slate-700">
          The Intern agrees to keep confidential all non-public information of the Host Startup encountered during the placement.
        </p>
      </div>

      <div className="mt-7">
        <div className="text-xs font-sans font-bold uppercase tracking-wide text-slate-500 mb-3">5. Signatures</div>
        <div className="flex flex-wrap gap-4">
          <SignatureBlock label="Host Startup" signedAt={contract.startupSignedAt} />
          <SignatureBlock label="Intern" signedAt={contract.signedAt} signatureData={contract.signatureData} />
          <SignatureBlock label="QSTP Admin" signedAt={qstpSignedAt} signatureData={qstpSignature} />
        </div>
      </div>
    </div>
  )
}
