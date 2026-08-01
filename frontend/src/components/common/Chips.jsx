import { BadgeDollarSign, GraduationCap } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants'

export function StatusChip({ status }) {
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function TrackChip({ track }) {
  if (track === 'qstp') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-qstp-500 text-white">
        <BadgeDollarSign className="w-3 h-3" />QSTP Funded
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-white">
      <GraduationCap className="w-3 h-3" />Work Placement
    </span>
  )
}

export function CommitChip({ commitment }) {
  return commitment === 'FT' ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Full-time · 40h/wk</span>
  ) : (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Part-time · 20h/wk</span>
  )
}
