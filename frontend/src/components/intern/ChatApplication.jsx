import { useMemo, useState } from 'react'
import { Bot, Loader2, Send, Sparkles } from 'lucide-react'
import { QATAR_UNIS, CYCLES, HOW_HEARD_OPTIONS } from '../../utils/constants'

const GENDERS = ['Male', 'Female', 'Prefer not to say']
const ACADEMIC_STATUSES = ['Pursuing', 'Graduated within 2 years']
const DEGREES = ["Bachelor's", "Master's", 'PhD']
const COMMITMENTS = [{ value: 'PT', label: 'Part-time (20 hrs/wk)' }, { value: 'FT', label: 'Full-time (40 hrs/wk)' }]
const CYCLE_OPTIONS = CYCLES.map((c) => ({ value: c.id, label: `${c.label} (${c.start.slice(5)} → ${c.end.slice(5)})` }))

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isValidGradYear = (v) => {
  const n = Number(v)
  return /^\d{4}$/.test(v) && n >= new Date().getFullYear() - 1 && n <= new Date().getFullYear() + 10
}

// Ordered conversation script. `long: true` fields (essay-style answers) always get
// their own turn; everything else is grouped into batches of up to 3 quick questions.
const FIELDS = [
  { key: 'fullName', q: 'What is your full name, exactly as it appears on your QID?', type: 'text', required: true },
  { key: 'qid', q: 'What is your QID number?', type: 'text', required: true, mono: true },
  { key: 'nationality', q: 'What is your nationality?', type: 'text', required: true },

  { key: 'email', q: 'Confirm the email we should use for your application.', type: 'text', required: true, validate: isValidEmail, hint: 'Enter a valid email address.' },
  { key: 'phone', q: 'What is your phone number, with country code?', type: 'text', required: true },
  { key: 'gender', q: 'How do you identify?', type: 'select', options: GENDERS, required: true },

  { key: 'university', q: 'Which university are you studying at?', type: 'select', options: QATAR_UNIS, required: true },
  { key: 'currentAcademicStatus', q: 'What is your current academic status?', type: 'select', options: ACADEMIC_STATUSES, required: true },
  { key: 'degree', q: 'What degree are you pursuing?', type: 'select', options: DEGREES, required: true },

  { key: 'major', q: 'What is your major?', type: 'text', required: true },
  { key: 'gradYear', q: 'What year do you expect to graduate?', type: 'text', required: true, validate: isValidGradYear, hint: 'Enter a 4-digit year (e.g. 2027).' },
  { key: 'commitment', q: 'Full-time or part-time?', type: 'select', options: COMMITMENTS.map((c) => c.value), labels: COMMITMENTS, required: true },

  { key: 'cycle', q: 'Which cycle would you like to join?', type: 'select', options: CYCLE_OPTIONS.map((c) => c.value), labels: CYCLE_OPTIONS, required: true },
  { key: 'howHeard', q: 'How did you hear about QSTP?', type: 'select', options: HOW_HEARD_OPTIONS, required: true },
  { key: 'referralOrg', q: 'Anyone we should credit for referring you? (optional)', type: 'text', required: false },

  { key: 'cvLink', q: 'Paste a link to your CV / resume.', type: 'text', required: true },
  { key: 'linkedin', q: 'Your LinkedIn profile link? (optional)', type: 'text', required: false },
  { key: 'portfolio', q: 'A portfolio or GitHub link? (optional)', type: 'text', required: false },

  { key: 'skillSet', q: 'List your key skills, separated by commas.', type: 'text', required: true },

  { key: 'whyInterested', q: 'Now tell us in your own words — why are you interested in joining QSTP, and what drives you?', type: 'textarea', required: true, long: true },
  { key: 'additionalComments', q: 'Anything else you would like us to know? (optional)', type: 'textarea', required: false, long: true },

  {
    key: 'consentDataPolicy',
    q: 'Last thing — do you consent to the Qatar Foundation Personal Data Protection Policy?',
    short: 'I consent to the Data Protection Policy.',
    type: 'checkbox',
    required: true,
  },
  {
    key: 'consentMediaRelease',
    q: 'And, optionally, do you consent to media release and future event notifications?',
    short: 'Yes, I consent to media release (optional).',
    type: 'checkbox',
    required: false,
  },
]

function buildGroups(fields) {
  const groups = []
  let cur = []
  for (const f of fields) {
    if (f.long) {
      if (cur.length) { groups.push(cur); cur = [] }
      groups.push([f])
    } else {
      cur.push(f)
      if (cur.length === 3) { groups.push(cur); cur = [] }
    }
  }
  if (cur.length) groups.push(cur)
  return groups
}

const GROUPS = buildGroups(FIELDS)

const MOTIVATION = [
  [0, "Let's get your QSTP application going — just a couple of minutes."],
  [20, 'Nice pace — keep it up!'],
  [40, "You're doing great, more than a third done."],
  [60, 'Over halfway there — your future startup is waiting.'],
  [80, 'Almost there — just a little more.'],
  [95, 'Last stretch — finish strong!'],
]

function motivationFor(pct) {
  let msg = MOTIVATION[0][1]
  for (const [at, m] of MOTIVATION) if (pct >= at) msg = m
  return msg
}

function displayValue(field, value) {
  if (field.type === 'checkbox') return value ? 'Yes' : field.required ? '—' : 'No'
  if (!value) return '(skipped)'
  const resolved = field.labels ? field.labels.find((l) => l.value === value)?.label || value : value
  const str = String(resolved)
  return str.length > 80 ? `${str.slice(0, 80)}…` : str
}

export default function ChatApplication({ form, set, autoFilled, onSubmit, submitting }) {
  const [groupIdx, setGroupIdx] = useState(0)
  const totalGroups = GROUPS.length
  const pct = Math.round((groupIdx / totalGroups) * 100)
  const isLast = groupIdx === totalGroups - 1
  const currentGroup = GROUPS[groupIdx]

  const canAdvance = useMemo(
    () =>
      !currentGroup.some((f) => {
        if (f.type === 'checkbox') return f.required && form[f.key] !== true
        const val = String(form[f.key] ?? '').trim()
        if (f.required && !val) return true
        if (val && f.validate && !f.validate(val)) return true
        return false
      }),
    [currentGroup, form]
  )

  const advance = () => {
    if (!canAdvance) return
    if (isLast) onSubmit()
    else setGroupIdx((i) => i + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span className="inline-flex items-center gap-1 font-medium text-qstp-700">
          <Sparkles className="w-3.5 h-3.5" /> {motivationFor(pct)}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-qstp-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 space-y-4 max-h-[46vh] overflow-y-auto pr-1">
        {GROUPS.slice(0, groupIdx).map((group, gi) => (
          <div key={gi} className="space-y-1.5">
            <ChatBubble from="bot">{group.map((f) => f.q).join(' ')}</ChatBubble>
            <ChatBubble from="user">{group.map((f) => displayValue(f, form[f.key])).join(' · ')}</ChatBubble>
          </div>
        ))}

        <div key={groupIdx} className="space-y-2 slide-up">
          <ChatBubble from="bot">{currentGroup.map((f) => f.q).join(' ')}</ChatBubble>
          <div className="ml-9 space-y-3 bg-qstp-50/60 border border-qstp-100 rounded-xl p-3">
            {currentGroup.map((f) => (
              <FieldInput key={f.key} field={f} value={form[f.key]} onChange={set(f.key)} auto={autoFilled.has(f.key)} />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={advance}
        disabled={!canAdvance || submitting}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? 'Submitting…' : isLast ? 'Submit Application' : 'Continue'}
      </button>
      {groupIdx > 0 && !submitting && (
        <button
          onClick={() => setGroupIdx((i) => Math.max(0, i - 1))}
          className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600"
        >
          ‹ Back
        </button>
      )}
    </div>
  )
}

function ChatBubble({ from, children }) {
  const isBot = from === 'bot'
  return (
    <div className={`flex items-start gap-2 ${isBot ? '' : 'justify-end'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-qstp-500 text-white flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4" />
        </div>
      )}
      <div className={`text-sm rounded-2xl px-3.5 py-2 max-w-[85%] ${isBot ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-qstp-500 text-white rounded-tr-sm'}`}>
        {children}
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange, auto }) {
  const badge = auto && (
    <span className="block w-fit mb-1 text-[10px] font-semibold text-qstp-600 bg-qstp-50 border border-qstp-100 rounded px-1 py-0.5">
      Auto-filled from your CV
    </span>
  )
  if (field.type === 'select') {
    return (
      <div>
        {badge}
        <select value={value || ''} onChange={onChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm bg-white">
          <option value="" disabled>Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{field.labels ? field.labels.find((l) => l.value === o)?.label : o}</option>
          ))}
        </select>
      </div>
    )
  }
  if (field.type === 'textarea') {
    return (
      <div>
        {badge}
        <textarea
          rows={4}
          value={value || ''}
          onChange={onChange}
          placeholder="Type your answer…"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm bg-white"
        />
      </div>
    )
  }
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={!!value} onChange={onChange} className="mt-0.5" />
        {field.short || field.q}
      </label>
    )
  }
  const invalid = !!value && field.validate && !field.validate(String(value).trim())
  return (
    <div>
      {badge}
      <input
        value={value || ''}
        onChange={onChange}
        placeholder="Type your answer…"
        className={`w-full px-3 py-2 border rounded-lg ring-focus text-sm bg-white ${field.mono ? 'font-mono' : ''} ${invalid ? 'border-rose-300' : 'border-slate-200'}`}
      />
      {invalid && field.hint && <div className="text-[11px] text-rose-600 mt-1">{field.hint}</div>}
    </div>
  )
}
