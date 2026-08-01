import { useState } from 'react'
import { User, Building, Rocket, ShieldCheck, LogIn, FilePlus2, ArrowLeft, ListChecks } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import NewApplicationWizard from '../components/intern/NewApplicationWizard'
import WalkthroughGuide from '../components/common/WalkthroughGuide'

const ROLES = [
  { role: 'intern', Icon: User, title: 'Intern', desc: 'Match with startups, sign contracts' },
  { role: 'university', Icon: Building, title: 'University', desc: 'Push Work Placement students' },
  { role: 'startup', Icon: Rocket, title: 'Startup', desc: 'Hire interns, manage cohorts' },
  { role: 'admin', Icon: ShieldCheck, title: 'QSTP Admin', desc: 'Operations & automation' },
]

const ORG_ROLES = ['university', 'startup', 'admin']

// Demo credentials — pre-filled on role selection so the fields never sit empty
// (which is what invites browser extensions to auto-inject their own values).
const DEFAULT_CREDENTIALS = {
  university: { username: 'university@qstp.qa', password: 'university123' },
  startup: { username: 'startup@qstp.qa', password: 'startup123' },
  admin: { username: 'admin@qstp.qa', password: 'admin123' },
}
const DEFAULT_INTERN_EMAIL = 'aisha@qu.edu.qa'

export default function Login() {
  const { loginIntern, loginRole } = useAuth()
  const toast = useToast()
  const [pending, setPending] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const [step, setStep] = useState('role') // 'role' | 'credentials'
  const [selectedRole, setSelectedRole] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [noAccount, setNoAccount] = useState(false)

  const [orgUsername, setOrgUsername] = useState('')
  const [orgPassword, setOrgPassword] = useState('')
  const [orgError, setOrgError] = useState(false)

  const chooseRole = (role) => {
    setSelectedRole(role)
    setStep('credentials')
    setEmail(role === 'intern' ? DEFAULT_INTERN_EMAIL : '')
    setPassword(role === 'intern' ? 'demo' : '')
    setNoAccount(false)
    setOrgUsername(DEFAULT_CREDENTIALS[role]?.username || '')
    setOrgPassword(DEFAULT_CREDENTIALS[role]?.password || '')
    setOrgError(false)
  }

  const backToRoles = () => {
    setStep('role')
    setSelectedRole(null)
  }

  const handleInternLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { toast('Enter your email and password', 'error'); return }
    setPending('intern')
    setNoAccount(false)
    try {
      await loginIntern(email.trim(), password)
      toast('Signed in', 'success')
    } catch (err) {
      if (err?.response?.status === 404) {
        setNoAccount(true)
      } else {
        toast('Login failed', 'error')
      }
    } finally {
      setPending(null)
    }
  }

  const handleOrgLogin = async (e) => {
    e.preventDefault()
    if (!orgUsername.trim() || !orgPassword.trim()) { toast('Enter your username and password', 'error'); return }
    setPending(selectedRole)
    setOrgError(false)
    try {
      await loginRole(selectedRole, orgUsername.trim(), orgPassword)
      toast('Signed in', 'success')
    } catch (err) {
      if (err?.response?.status === 401) setOrgError(true)
      else toast('Login failed', 'error')
    } finally {
      setPending(null)
    }
  }

  if (wizardOpen) {
    return <NewApplicationWizard onClose={() => setWizardOpen(false)} onDone={() => setWizardOpen(false)} />
  }

  const roleMeta = ROLES.find((r) => r.role === selectedRole)

  return (
    <div className="min-h-screen grad-hero flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl qstp-dots shadow-soft" />
          <div>
            <div className="font-bold text-lg text-slate-900 leading-none">QSTP Connect</div>
            <div className="text-[11px] text-qstp-700 mt-1">Member of Qatar Foundation</div>
          </div>
        </div>
      </header>

      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto px-6 pb-10 w-full">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-white border border-slate-200 text-qstp-700 px-3 py-1.5 rounded-full shadow-card">
            <span className="w-1.5 h-1.5 rounded-full bg-qstp-500 pulse-dot" />
            Internship Operations · Winter · Summer · Fall
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            One platform for the entire <span className="text-qstp-600">QSTP internship</span> lifecycle.
          </h1>
          <p className="text-slate-600 text-lg max-w-lg">
            From application to onboarding — matching interns, startups, and universities across QSTP-funded and Work Placement tracks.
          </p>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-card"
          >
            <ListChecks className="w-4 h-4" /> Judge Walkthrough Guide
          </button>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-slate-900">1,000+</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Applications</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-slate-900">~20</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Startups</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-slate-900">12 wks</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Per Cycle</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 md:p-8 w-full max-w-md ml-auto overflow-hidden">
          {step === 'role' && (
            <div className="slide-up">
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">Select your role — everything runs locally.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {ROLES.map(({ role, Icon, title, desc }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => chooseRole(role)}
                    className="text-left rounded-xl border border-slate-200 p-4 hover:border-qstp-400 hover:bg-qstp-50/40 hover:shadow-card transition group"
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-qstp-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</div>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 mt-6 text-center">By continuing you agree to QSTP Connect's prototype terms.</p>
            </div>
          )}

          {step === 'credentials' && selectedRole === 'intern' && (
            <div className="slide-up">
              <button onClick={backToRoles} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
                <ArrowLeft className="w-3.5 h-3.5" /> All roles
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-qstp-100 text-qstp-700 grid place-items-center"><User className="w-4.5 h-4.5" /></div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Intern Sign In</h2>
                  <p className="text-xs text-slate-500">Sign in with your email, or start a new application.</p>
                </div>
              </div>

              <form onSubmit={handleInternLogin} className="mt-3 space-y-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setNoAccount(false) }}
                  placeholder="you@university.edu.qa"
                  autoFocus
                  autoComplete="username"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus"
                />
                <button
                  type="submit"
                  disabled={pending !== null}
                  className="w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  <LogIn className="w-4 h-4" /> {pending === 'intern' ? 'Signing in…' : 'Sign In'}
                </button>
                {noAccount && (
                  <div className="text-xs bg-amber-50 border border-amber-100 text-amber-800 rounded-lg p-2.5">
                    No application found for that email.{' '}
                    <button type="button" onClick={() => setWizardOpen(true)} className="font-semibold underline">
                      Start a new application
                    </button>
                  </div>
                )}
              </form>

              <button
                onClick={() => setWizardOpen(true)}
                className="mt-2.5 w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-dashed border-qstp-300 text-qstp-700 hover:bg-qstp-50"
              >
                <FilePlus2 className="w-4 h-4" /> New Application
              </button>
            </div>
          )}

          {step === 'credentials' && ORG_ROLES.includes(selectedRole) && (
            <div className="slide-up">
              <button onClick={backToRoles} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
                <ArrowLeft className="w-3.5 h-3.5" /> All roles
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 grid place-items-center">
                  {roleMeta && <roleMeta.Icon className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{roleMeta?.title} Sign In</h2>
                  <p className="text-xs text-slate-500">{roleMeta?.desc}</p>
                </div>
              </div>
              <form onSubmit={handleOrgLogin} className="mt-3 space-y-2.5">
                <input
                  value={orgUsername}
                  onChange={(e) => { setOrgUsername(e.target.value); setOrgError(false) }}
                  placeholder={`${selectedRole}@qstp.qa`}
                  autoFocus
                  autoComplete="username"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus"
                />
                <input
                  type="password"
                  value={orgPassword}
                  onChange={(e) => { setOrgPassword(e.target.value); setOrgError(false) }}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg ring-focus"
                />
                <button
                  type="submit"
                  disabled={pending !== null}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  <LogIn className="w-4 h-4" /> {pending === selectedRole ? 'Signing in…' : 'Sign In'}
                </button>
                {orgError && (
                  <div className="text-xs bg-rose-50 border border-rose-100 text-rose-700 rounded-lg p-2.5 slide-up">
                    Invalid username or password.
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-4">
        © 2026 Qatar Science &amp; Technology Park · powered by <span className="font-semibold text-slate-600">Dino - mites</span>
      </footer>

      {guideOpen && <WalkthroughGuide onClose={() => setGuideOpen(false)} />}
    </div>
  )
}
