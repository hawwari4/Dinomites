import { useEffect, useMemo, useState } from 'react'
import { GitBranch, Building, Cog, ClipboardCheck, CalendarRange, ListChecks } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { statsApi, byocApi, candidateApi, startupApi } from '../api/endpoints'
import Spinner from '../components/common/Spinner'
import Funnel from '../components/admin/Funnel'
import StartupLoad from '../components/admin/StartupLoad'
import AutomationHub from '../components/admin/AutomationHub'
import ByocQueue from '../components/admin/ByocQueue'
import CycleGrid from '../components/admin/CycleGrid'
import DecisionsFeed from '../components/admin/DecisionsFeed'
import StartupDetailModal from '../components/intern/StartupDetailModal'
import CandidateModal from '../components/startup/CandidateModal'

export default function AdminPortal() {
  const { data: stats, loading, refetch: refetchStats } = useApi(() => statsApi.dashboard(), [])
  const { data: byoc, refetch: refetchByoc } = useApi(() => byocApi.list(), [])
  const { data: candidates, refetch: refetchCandidates } = useApi(() => candidateApi.list(), [])

  const [viewingStartupId, setViewingStartupId] = useState(null)
  const [startupDetail, setStartupDetail] = useState(null)
  const [viewingCandidate, setViewingCandidate] = useState(null)

  useEffect(() => {
    if (!viewingStartupId) { setStartupDetail(null); return }
    let cancelled = false
    startupApi.get(viewingStartupId).then((s) => { if (!cancelled) setStartupDetail(s) })
    return () => { cancelled = true }
  }, [viewingStartupId])

  const candidateIdsByKind = useMemo(() => {
    const list = candidates || []
    return {
      mass_email: list.filter((c) => ['matched', 'interviewing', 'onboarding'].includes(c.status)).map((c) => c.id),
      contracts: list.filter((c) => c.status === 'onboarding').map((c) => c.id),
      payroll: list.filter((c) => c.status === 'onboarding' && c.track === 'qstp').map((c) => c.id),
    }
  }, [candidates])

  if (loading || !stats) return <Spinner label="Loading dashboard…" />

  const refreshAll = () => { refetchStats(); refetchByoc(); refetchCandidates() }

  const handleDeleteCandidate = async (candidateId) => {
    await candidateApi.remove(candidateId)
    refreshAll()
  }

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricTile label="Applications" value={stats.applications.toLocaleString()} />
        <MetricTile label="Startups Live" value={stats.startupsLive} />
        <MetricTile label="Universities" value={stats.universities} />
        <MetricTile label="QSTP-Funded Slots" value={stats.qstpFundedSlots} valueClass="text-qstp-600" />
        <MetricTile label="Work Placement" value={stats.workPlacementSlots} valueClass="text-purple-600" />
        <MetricTile label="Conversion" value={`${stats.conversionPct}%`} valueClass="text-emerald-600" />
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><GitBranch className="w-5 h-5 text-qstp-600" /> Application Funnel</h2>
          <p className="text-sm text-slate-500 mt-0.5">Aggregated across all startups and universities.</p>
          <div className="mt-5"><Funnel stages={stats.funnel} /></div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Building className="w-4 h-4 text-qstp-600" /> Startup Cohort Load</h3>
            <StartupLoad startups={stats.startupLoad} onSelect={setViewingStartupId} />
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Cog className="w-5 h-5 text-qstp-600" /> Automation Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">Trigger cohort-wide operations.</p>
          <AutomationHub candidates={candidates} candidateIdsByKind={candidateIdsByKind} onRun={refreshAll} />
        </div>

        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ListChecks className="w-5 h-5 text-qstp-600" /> Recent Startup Decisions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Candidates recently confirmed or rejected by startups, with feedback.</p>
          <div className="mt-4"><DecisionsFeed candidates={candidates} onSelect={setViewingCandidate} onDelete={handleDeleteCandidate} /></div>
        </div>

        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-qstp-600" /> BYOC Approval Queue</h2>
              <p className="text-sm text-slate-500 mt-0.5">Startup-nominated candidates awaiting QSTP review.</p>
            </div>
            <span className="text-xs font-semibold text-qstp-700 bg-qstp-50 border border-qstp-100 px-2.5 py-1 rounded-full">{stats.byocPending} pending</span>
          </div>
          <div className="mt-4"><ByocQueue submissions={byoc} onChanged={refreshAll} /></div>
        </div>

        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><CalendarRange className="w-5 h-5 text-qstp-600" /> Cycle Timelines</h2>
          <CycleGrid cycles={stats.cycles} />
        </div>
      </section>

      {viewingStartupId && startupDetail && (
        <StartupDetailModal startup={startupDetail} onClose={() => setViewingStartupId(null)} />
      )}
      {viewingCandidate && (
        <CandidateModal candidate={viewingCandidate} onClose={() => setViewingCandidate(null)} />
      )}
    </>
  )
}

function MetricTile({ label, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${valueClass}`}>{value}</div>
    </div>
  )
}
