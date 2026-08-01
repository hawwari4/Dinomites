import { UploadCloud, List, CalendarDays } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { universityApi, candidateApi } from '../api/endpoints'
import { CommitChip, StatusChip } from '../components/common/Chips'
import { CYCLES } from '../utils/constants'
import { cycleLabel, initials } from '../utils/helpers'
import Spinner from '../components/common/Spinner'
import PushStudentForm from '../components/university/PushStudentForm'
import BulkUploadForm from '../components/university/BulkUploadForm'

export default function UniversityPortal({ user }) {
  const { data: uni, loading: loadingUni } = useApi(() => universityApi.get(user.universityId), [user.universityId])
  const { data: mine, loading: loadingCands, refetch } = useApi(
    () => (uni ? candidateApi.list({ university: uni.name, track: 'placement' }) : Promise.resolve([])),
    [uni?.id],
  )

  if (loadingUni || !uni) return <Spinner label="Loading university…" />

  const inProgress = mine?.filter((c) => ['matched', 'interviewing', 'onboarding', 'contract_sent'].includes(c.status)).length || 0
  const placed = mine?.filter((c) => c.status === 'onboarding' || c.status === 'contract_sent').length || 0

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-purple-700 to-qstp-700 text-white p-6 md:p-8 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest opacity-80">University Portal</div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{uni.name}</h1>
            <p className="opacity-90 mt-1 text-sm">Push Work Placement students onto the QSTP internship pipeline.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Pushed" value={mine?.length || 0} />
            <Stat label="In Progress" value={inProgress} />
            <Stat label="Placed" value={placed} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-qstp-600" /> Push Student</h2>
          <p className="text-sm text-slate-500 mt-0.5">Add individual Work Placement candidate.</p>
          <PushStudentForm universityName={uni.name} onPushed={refetch} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <BulkUploadForm universityName={uni.name} onUploaded={refetch} />

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><List className="w-4 h-4 text-qstp-600" /> My Placement Pipeline</h3>
            <div className="mt-3 space-y-2">
              {loadingCands ? (
                <Spinner label="Loading pipeline…" />
              ) : !mine?.length ? (
                <div className="text-xs text-slate-400 italic">No students pushed yet.</div>
              ) : (
                mine.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 grid place-items-center text-xs font-semibold">{initials(c.fullName)}</div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{c.fullName}</div>
                        <div className="text-[11px] text-slate-500">{c.major} · {cycleLabel(c.cycle)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CommitChip commitment={c.commitment} />
                      <StatusChip status={c.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-qstp-600" /> Academic Timelines</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CYCLES.map((c) => {
                const count = mine?.filter((m) => m.cycle === c.id).length || 0
                return (
                  <div key={c.id} className="border border-slate-100 rounded-xl p-3">
                    <div className="text-xs uppercase tracking-widest text-slate-500">{c.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.start} → {c.end}</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{count} <span className="text-xs font-normal text-slate-500">students</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 rounded-xl p-3 text-center">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] opacity-80">{label}</div>
    </div>
  )
}
