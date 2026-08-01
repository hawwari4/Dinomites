export const CYCLES = [
  { id: 'winter', label: 'Winter', start: '2026-01-29', end: '2026-04-21' },
  { id: 'summer', label: 'Summer', start: '2026-06-14', end: '2026-09-03' },
  { id: 'fall', label: 'Fall', start: '2026-10-01', end: '2026-12-20' },
]

export const TRACKS = {
  qstp: { id: 'qstp', label: 'QSTP Funded', contractedBy: 'Qatar Science & Technology Park', payroll: true },
  placement: { id: 'placement', label: 'Work Placement', contractedBy: 'Host Startup', payroll: false },
}

export const WORKFLOW = ['Identify Needs', 'App Submitted', 'Matched', 'Interviewing', 'Onboarding']

export const QATAR_UNIS = [
  'Qatar University', 'HBKU', 'Texas A&M Qatar', 'Carnegie Mellon Qatar',
  'Georgetown Qatar', 'UDST', 'Northwestern Qatar', 'Weill Cornell Qatar',
]

export const STATUS_LABELS = {
  submitted: 'Submitted',
  matched: 'Matched',
  interviewing: 'Interviewing',
  onboarding: 'Onboarding',
  contract_sent: 'Contract Sent',
  payroll_processed: 'Payroll',
  rejected: 'Rejected',
  pending_qstp_approval: 'Pending QSTP',
  approved: 'Approved',
}

export const BYOC_CAP = { free: 3, premium: 3 }
export const PREMIUM_PRICE = 12
export const STARTUP_MATCH_FREE_LIMIT = 3
export const STARTUP_MATCH_PREMIUM_LIMIT = 10

export const HOW_HEARD_OPTIONS = [
  'University career office', 'Social media', 'QSTP website', 'A friend or classmate',
  'A startup / employer', 'Career fair', 'Other',
]

export const STATUS_COLORS = {
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  matched: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  interviewing: 'bg-amber-50 text-amber-800 border-amber-100',
  onboarding: 'bg-qstp-50 text-qstp-700 border-qstp-100',
  contract_sent: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  payroll_processed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  pending_qstp_approval: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}
