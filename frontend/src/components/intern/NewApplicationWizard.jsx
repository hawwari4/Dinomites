import { useState } from 'react'
import { LogIn, FileUp, Wand2, Loader2, Sparkles, CheckCircle2, X } from 'lucide-react'
import ChatApplication from './ChatApplication'
import { candidateApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const EMPTY_FORM = {
  fullName: '', qid: '', nationality: 'Qatari', email: '', phone: '', gender: '',
  university: '', currentAcademicStatus: '', degree: '', major: '', gradYear: '',
  commitment: 'FT', cycle: 'winter', howHeard: '', referralOrg: '',
  cvLink: '', linkedin: '', portfolio: '', skillSet: '', whyInterested: '',
  additionalComments: '', consentDataPolicy: false, consentMediaRelease: false,
}

const STEPS = ['Sign in', 'Upload CV', 'Application', 'Your Matches']

function StepRail({ step }) {
  return (
    <div className="flex items-center max-w-xl w-full mx-auto px-6">
      {STEPS.map((label, i) => {
        const idx = i + 1
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold transition-colors ${
                  idx <= step ? 'bg-qstp-500 text-white' : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                {idx}
              </div>
              <div className={`text-[10px] mt-1 text-center ${idx <= step ? 'text-qstp-700 font-medium' : 'text-slate-400'}`}>{label}</div>
            </div>
            {idx < STEPS.length && <div className={`step-line mx-2 ${idx < step ? 'done' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function NewApplicationWizard({ onClose, onDone }) {
  const { persistSession } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [googleEmail, setGoogleEmail] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [autoFilled, setAutoFilled] = useState(new Set())
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [matches, setMatches] = useState([])
  const [pendingSession, setPendingSession] = useState(null)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const continueWithGoogle = () => {
    if (!googleEmail.trim()) { toast('Enter an email to continue', 'error'); return }
    setForm((f) => ({ ...f, email: googleEmail.trim() }))
    setStep(2)
  }

  const runExtraction = async () => {
    if (!cvFile) {
      toast('Upload your CV as a PDF first', 'error')
      return
    }
    setExtracting(true)
    try {
      const extracted = await candidateApi.extract(cvFile)
      const mapped = { ...extracted }
      if (mapped.skillSet) mapped.skillSet = mapped.skillSet.join(', ')
      setForm((f) => ({ ...f, ...mapped }))
      setAutoFilled(new Set(Object.keys(mapped)))
      toast('Auto-filled what we could find — please review', 'success')
    } catch (err) {
      if (err?.response?.status === 503) {
        toast('CV parsing isn’t configured yet — please fill the form manually', 'info')
      } else {
        toast('Could not auto-fill — please fill the form manually', 'error')
      }
    } finally {
      setExtracting(false)
      setStep(3)
    }
  }

  const skipToForm = () => setStep(3)

  const submit = async () => {
    setSubmitting(true)
    try {
      const created = await candidateApi.apply({
        ...form,
        skillSet: form.skillSet.split(',').map((s) => s.trim()).filter(Boolean),
      })
      const fullName = created.fullName || 'there'
      const name = fullName.split(' ')[0]
      const avatar = fullName.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?'
      // Fetch matches and stage the session before signing in — persistSession() flips the
      // app into the intern portal and unmounts this wizard, so anything that still needs
      // this component (the step-4 matches screen) must happen first.
      let allMatches = []
      try {
        allMatches = (await candidateApi.matches(created.id)) || []
      } catch {
        // Non-fatal — the application was already created; just show no matches yet.
      }
      setMatches(allMatches.slice(0, 3))
      setPendingSession({
        token: `mock-intern-${created.id}`,
        profile: { role: 'intern', candidateId: created.id, name: fullName, email: created.email, avatar },
      })
      toast(`Welcome, ${name}! Application submitted.`, 'success')
      setStep(4)
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not submit application', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const goToPortal = () => {
    if (pendingSession) persistSession(pendingSession.token, pendingSession.profile)
    onDone()
  }

  return (
    <div className="min-h-screen grad-hero flex flex-col">
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl qstp-dots shadow-soft" />
          <div>
            <div className="font-bold text-slate-900 leading-none">QSTP Connect</div>
            <div className="text-[11px] text-qstp-700 mt-1">New Application</div>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/60">
          <X className="w-4 h-4" /> Close
        </button>
      </header>

      <div className="mb-2">
        <StepRail step={step} />
      </div>

      <main className="flex-1 flex items-start justify-center px-6 pb-10 pt-4">
        <div key={step} className="slide-page w-full max-w-xl bg-white rounded-2xl shadow-soft border border-slate-100 p-6 md:p-8">
          {step === 1 && (
            <div className="text-center py-4">
              <LogIn className="w-10 h-10 text-qstp-600 mx-auto" />
              <h2 className="text-lg font-semibold text-slate-900 mt-3">Sign in with Google to start your QSTP application.</h2>
              <input
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-4 w-full px-3 py-2 border border-slate-200 rounded-lg ring-focus text-sm"
              />
              <button
                onClick={continueWithGoogle}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                <LogIn className="w-4 h-4" /> Continue with Google
              </button>
              <p className="text-[11px] text-slate-400 mt-3">Demo sign-in — no real Google account is contacted.</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your CV</h2>
              <p className="text-sm text-slate-600 mt-1.5">
                Upload your CV/resume as a PDF and we'll auto-fill the application for you — matching against startups
                runs off the skills we find on it. LinkedIn and portfolio are just optional profile links you can add
                later in the form.
              </p>
              <label className="mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl px-4 py-8 cursor-pointer hover:border-qstp-400 hover:bg-qstp-50/40 transition text-center">
                <FileUp className="w-6 h-6 text-qstp-600" />
                <span className="text-sm font-medium text-slate-700">
                  {cvFile ? cvFile.name : 'Click to upload your CV (PDF)'}
                </span>
                {!cvFile && <span className="text-[11px] text-slate-400">Max 15MB</span>}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
              </label>

              <div className="mt-4 flex gap-2">
                <button onClick={skipToForm} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  Skip — fill manually
                </button>
                <button
                  onClick={runExtraction}
                  disabled={extracting || !cvFile}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {extracting ? 'Auto-filling…' : 'Auto-fill from my CV'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Official Application</h2>
              <ChatApplication form={form} set={set} autoFilled={autoFilled} onSubmit={submit} submitting={submitting} />
            </>
          )}

          {step === 4 && (
            <div>
              <div className="text-center py-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto pop-in" />
                <h3 className="font-semibold text-slate-900 mt-2 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-qstp-600" /> Your Top {matches.length || 3} Matches
                </h3>
                <p className="text-xs text-slate-500 mt-1">Startups our AI thinks fit your skills best.</p>
              </div>
              <div className="mt-3 space-y-2">
                {matches.map((s, i) => (
                  <div
                    key={s.id}
                    style={{ animationDelay: `${i * 90}ms` }}
                    className="slide-up border border-slate-100 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.sector}</div>
                    </div>
                    <div className="text-lg font-extrabold text-qstp-600">{s.score}%</div>
                  </div>
                ))}
              </div>
              <button onClick={goToPortal} className="mt-5 w-full bg-qstp-500 hover:bg-qstp-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
                Go to my portal
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
