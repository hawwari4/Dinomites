import { useState } from 'react'
import { IdCard, Pencil, Wand2, RefreshCw, FileSignature, FileText, Link2, Code2, Bell } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { candidateApi, contractApi, notificationApi } from '../api/endpoints'
import { TrackChip, CommitChip } from '../components/common/Chips'
import { cycleLabel } from '../utils/helpers'
import Spinner from '../components/common/Spinner'
import StartupFeed from '../components/intern/StartupFeed'
import ContractHub from '../components/intern/ContractHub'
import EditProfileModal from '../components/intern/EditProfileModal'
import NotificationsPanel from '../components/intern/NotificationsPanel'

export default function InternPortal({ user }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const { data: me, loading, refetch: refetchMe } = useApi(() => candidateApi.get(user.candidateId), [user.candidateId])
  const { data: startupMatches, refetch: refetchStartupMatches } = useApi(
    () => candidateApi.matches(user.candidateId),
    [user.candidateId],
  )
  const { data: contracts, refetch: refetchContracts } = useApi(() => contractApi.list(user.candidateId), [user.candidateId])
  const { data: notifications, refetch: refetchNotifications } = useApi(
    () => notificationApi.list(user.candidateId),
    [user.candidateId],
  )
  const unreadCount = (notifications || []).filter((n) => !n.read).length

  if (loading || !me) return <Spinner label="Loading your profile…" />

  const saveProfile = async (patch) => {
    await candidateApi.update(me.id, patch)
    toast('Application updated', 'success')
    setEditing(false)
    refetchMe()
  }

  const rescore = async () => {
    await refetchStartupMatches()
    toast('Re-scored startups', 'success')
  }

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-qstp-600 to-qstp-800 text-white p-6 md:p-8 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
              Intern Portal · <TrackChip track={me.track} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">Welcome, {me.fullName.split(' ')[0]}</h1>
            <p className="opacity-90 mt-1 text-sm md:text-base">{me.university} · {me.major} · {me.currentAcademicStatus}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CommitChip commitment={me.commitment} />
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 border border-white/25">Cycle: {cycleLabel(me.cycle)}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 border border-white/25">12-week duration</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-widest opacity-80">Skills Match</div>
              <div className="text-2xl font-extrabold mt-1">{(me.skillSet || []).length}</div>
              <div className="text-[11px] opacity-80">tracked skills</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-widest opacity-80">Contracts</div>
              <div className="text-2xl font-extrabold mt-1">{contracts?.length || 0}</div>
              <div className="text-[11px] opacity-80">active / pending</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><IdCard className="w-5 h-5 text-qstp-600" /> Official Application</h2>
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" />Edit
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Full Name (as per QID)" value={me.fullName} />
          <Field label="QID No" value={me.qid} mono />
          <Field label="Nationality" value={me.nationality} />
          <Field label="Email" value={me.email} />
          <Field label="Phone" value={me.phone} />
          <Field label="Gender" value={me.gender} />
          <Field label="University" value={me.university} />
          <Field label="Degree · Major" value={`${me.degree} · ${me.major}`} />
          <Field label="Graduation Year" value={me.gradYear} />
          <div className="md:col-span-3">
            <div className="text-[11px] uppercase text-slate-500 mb-1">Skills Set (used by AI Matchmaker)</div>
            <div className="flex flex-wrap gap-1.5">
              {(me.skillSet || []).map((s) => <span key={s} className="text-xs bg-qstp-50 text-qstp-700 border border-qstp-100 rounded-md px-2 py-0.5">{s}</span>)}
            </div>
          </div>
          <div className="md:col-span-3 flex flex-wrap gap-3 text-xs">
            <a href={me.cvLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><FileText className="w-3.5 h-3.5" />CV</a>
            <a href={me.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><Link2 className="w-3.5 h-3.5" />LinkedIn</a>
            <a href={me.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline"><Code2 className="w-3.5 h-3.5" />Portfolio</a>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Wand2 className="w-5 h-5 text-qstp-600" /> AI Matchmaking Feed</h2>
              <p className="text-sm text-slate-500 mt-0.5">Startups scored against your official Skills Set.</p>
            </div>
            <button onClick={rescore} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />Re-score
            </button>
          </div>
          <div className="mt-4">
            <StartupFeed startups={startupMatches} />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-qstp-600" /> Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-qstp-500 text-white rounded-full px-1.5 py-0.5">{unreadCount} new</span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Updates from QSTP and questions startups have asked about your application.</p>
            <div className="mt-4">
              <NotificationsPanel notifications={notifications} onRead={refetchNotifications} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><FileSignature className="w-5 h-5 text-qstp-600" /> Contract Hub</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign &amp; accept auto-generated contracts.</p>
            <div className="mt-4">
              <ContractHub contracts={contracts} onSigned={() => { refetchContracts(); refetchMe() }} />
            </div>
          </div>
        </div>
      </section>

      {editing && <EditProfileModal candidate={me} onClose={() => setEditing(false)} onSave={saveProfile} />}
    </>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className={`text-slate-900 ${mono ? 'font-mono' : 'font-semibold'}`}>{value}</div>
    </div>
  )
}
