import { useState } from 'react'
import { Workflow, Sparkles } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { startupApi, byocApi } from '../api/endpoints'
import { WORKFLOW } from '../utils/constants'
import { initials } from '../utils/helpers'
import Spinner from '../components/common/Spinner'
import CandidateList from '../components/startup/CandidateList'
import InternshipDescriptions from '../components/startup/InternshipDescriptions'
import ByocPanel from '../components/startup/ByocPanel'
import InternFeed from '../components/startup/InternFeed'
import PremiumModal from '../components/startup/PremiumModal'

export default function StartupPortal({ user }) {
  const toast = useToast()
  const [premiumModalOpen, setPremiumModalOpen] = useState(false)
  const [togglingPremium, setTogglingPremium] = useState(false)
  const { data: startup, loading, refetch: refetchStartup } = useApi(() => startupApi.get(user.startupId), [user.startupId])
  const { data: candidates, refetch: refetchCandidates } = useApi(() => startupApi.candidates(user.startupId), [user.startupId])
  const { data: byoc, refetch: refetchByoc } = useApi(() => byocApi.list(user.startupId), [user.startupId])
  const { data: internMatches, refetch: refetchMatches } = useApi(() => startupApi.internMatches(user.startupId), [user.startupId])
  const { data: descriptions, refetch: refetchDescriptions } = useApi(() => startupApi.descriptions(user.startupId), [user.startupId])

  if (loading || !startup) return <Spinner label="Loading startup…" />

  const cohortsLeft = 3 - startup.qstpCohortsUsed
  const cohortColor = startup.qstpCohortsUsed >= 3 ? 'from-rose-600 to-rose-800' : startup.qstpCohortsUsed === 2 ? 'from-amber-500 to-amber-700' : 'from-qstp-600 to-qstp-800'

  const togglePremium = async (checked) => {
    if (checked) { setPremiumModalOpen(true); return }
    if (togglingPremium) return
    setTogglingPremium(true)
    try {
      await startupApi.update(startup.id, { premium: false })
      toast('Premium deactivated', 'info')
      refetchStartup()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not update premium status', 'error')
    } finally {
      setTogglingPremium(false)
    }
  }

  const onUpgraded = () => {
    setPremiumModalOpen(false)
    refetchStartup()
    refetchMatches()
  }

  const refreshAll = () => { refetchCandidates(); refetchStartup() }
  const onAssigned = () => { refetchCandidates(); refetchMatches() }

  return (
    <>
      <section className={`rounded-2xl bg-gradient-to-br ${cohortColor} text-white p-6 md:p-8 shadow-soft`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/25 grid place-items-center font-extrabold text-lg shrink-0">
                {initials(startup.name)}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Startup Portal</div>
                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{startup.name}</h1>
              </div>
            </div>
            <p className="opacity-90 mt-3 text-sm">
              {startup.qstpCohortsUsed >= 3
                ? '⚠ You have reached your QSTP-funded cohort limit. You may only request Work Placement interns.'
                : `${cohortsLeft} QSTP-funded cohort${cohortsLeft > 1 ? 's' : ''} remaining · Work Placement always available.`}
            </p>
            <div className="mt-1 text-xs opacity-80">QSTP Funded Cohorts Used: {startup.qstpCohortsUsed} / 3</div>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className={`w-14 h-2 rounded-full ${i <= startup.qstpCohortsUsed ? 'bg-white' : 'bg-white/25'}`} />)}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Premium Profile</div>
                <div className="text-sm mt-1">Advanced filtering &amp; priority match</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={startup.premium}
                  disabled={togglingPremium}
                  onChange={(e) => togglePremium(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
            <div className={`mt-2 text-[11px] ${startup.premium ? 'text-white' : 'opacity-70'}`}>
              {startup.premium ? '★ Premium active — full applicant data unlocked' : 'Standard — upgrade to unlock QID, university & GPA filters'}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {WORKFLOW.map((step, idx) => {
          const count = (candidates || []).filter((c) => (c.workflowIdx || 0) >= idx).length
          return (
            <div key={step} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-qstp-500 text-white text-[11px] font-bold grid place-items-center">{idx + 1}</div>
                <div className="text-[11px] uppercase tracking-widest text-slate-500">{step}</div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{count}</div>
            </div>
          )
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Workflow className="w-5 h-5 text-qstp-600" /> 5-Step Workflow Tracker</h2>
            <p className="text-sm text-slate-500 mt-0.5">Official QSTP intern journey — click a candidate to advance them.</p>
          </div>
          <div className="mt-5 flex items-center">
            {WORKFLOW.map((step, idx) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-qstp-500 text-white grid place-items-center text-xs font-bold">{idx + 1}</div>
                  <div className="text-[11px] text-slate-600 mt-1 text-center">{step}</div>
                </div>
                {idx < WORKFLOW.length - 1 && <div className="step-line done mx-2" />}
              </div>
            ))}
          </div>
          <CandidateList candidates={candidates} premium={startup.premium} startupId={startup.id} onChanged={refreshAll} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <ByocPanel startup={startup} submissions={byoc} onSubmitted={refetchByoc} />
          <InternshipDescriptions startup={startup} descriptions={descriptions} onUploaded={() => { refetchDescriptions(); refetchStartup() }} />
        </div>

        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-qstp-600" /> AI Matchmaking Feed — Interns</h2>
          <p className="text-sm text-slate-500 mt-0.5">Candidates scored against your uploaded internship descriptions.</p>
          <div className="mt-4">
            <InternFeed
              interns={internMatches}
              premium={startup.premium}
              startupId={startup.id}
              onAssigned={onAssigned}
              onUpgrade={() => setPremiumModalOpen(true)}
            />
          </div>
        </div>
      </section>

      {premiumModalOpen && (
        <PremiumModal startup={startup} onClose={() => setPremiumModalOpen(false)} onUpgraded={onUpgraded} />
      )}
    </>
  )
}
