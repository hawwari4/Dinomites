import { Building2, MapPin, FileText, Briefcase, Clock, Calendar } from 'lucide-react'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import { useApi } from '../../hooks/useApi'
import { startupApi } from '../../api/endpoints'
import { cycleLabel, initials } from '../../utils/helpers'

export default function StartupDetailModal({ startup, onClose }) {
  const { data: descriptions, loading } = useApi(() => startupApi.descriptions(startup.id), [startup.id])
  const cohortsFull = startup.qstpCohortsUsed >= 3

  return (
    <Modal
      title={startup.name}
      size="lg"
      onClose={onClose}
      footer={<button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Close</button>}
    >
      <div className="space-y-5 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-qstp-100 text-qstp-700 grid place-items-center font-semibold shrink-0">
            {initials(startup.name)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              {startup.name}
              {startup.premium && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">PREMIUM</span>}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
              <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{startup.sector}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{startup.location}</span>
            </div>
          </div>
        </div>

        <div className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-3">
          Track availability:{' '}
          <span className={cohortsFull ? 'text-rose-600 font-semibold' : 'text-qstp-700 font-semibold'}>
            {cohortsFull ? 'Work Placement only (QSTP 3/3)' : `QSTP ${startup.qstpCohortsUsed}/3 · Work Placement`}
          </span>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interests &amp; Skills Needed</div>
          <div className="flex flex-wrap gap-1.5">
            {(startup.needs || []).length
              ? startup.needs.map((n) => <span key={n} className="text-xs bg-qstp-50 text-qstp-700 border border-qstp-100 rounded-md px-2 py-0.5">{n}</span>)
              : <span className="text-xs text-slate-400 italic">No skills listed yet.</span>}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Internship Descriptions</div>
          {loading ? (
            <Spinner label="Loading job descriptions…" />
          ) : !descriptions?.length ? (
            <div className="text-xs text-slate-400 italic">No internship description uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {descriptions.map((d) => (
                <div key={d.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="font-semibold text-slate-900">{d.position || d.fileName}</div>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-qstp-700 hover:underline text-xs shrink-0">
                      <FileText className="w-3.5 h-3.5" />View document
                    </a>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    {d.commitment && <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{d.commitment === 'FT' ? 'Full-time' : 'Part-time'}</span>}
                    {d.weeklyHours != null && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{d.weeklyHours} hrs/week</span>}
                    {d.weeks != null && <span>{d.weeks} weeks</span>}
                    {d.cycle && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{cycleLabel(d.cycle)}</span>}
                  </div>
                  {d.summary && <p className="mt-2 text-xs text-slate-600">{d.summary}</p>}
                  {(d.extractedSkills || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.extractedSkills.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
