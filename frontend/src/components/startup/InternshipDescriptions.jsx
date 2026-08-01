import { useState } from 'react'
import { FileText, FileUp, Loader2, CheckCircle2 } from 'lucide-react'
import { startupApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

export default function InternshipDescriptions({ startup, descriptions, onUploaded }) {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [justUploaded, setJustUploaded] = useState(null)

  const upload = async () => {
    if (!file) { toast('Choose a PDF or .docx file first', 'error'); return }
    setUploading(true)
    try {
      const created = await startupApi.uploadDescription(startup.id, file)
      toast('Internship description uploaded successfully', 'success')
      setJustUploaded(created)
      setFile(null)
      onUploaded()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not upload document', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-qstp-600" /> New Internship Description
      </h2>
      <p className="text-xs text-slate-500 mt-0.5">
        Upload a PDF or Word job description — we'll pull the position, commitment and required skills straight
        into your AI Matchmaker.
      </p>

      <label className="mt-3 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl px-4 py-6 cursor-pointer hover:border-qstp-400 hover:bg-qstp-50/40 transition text-center">
        <FileUp className="w-5 h-5 text-qstp-600" />
        <span className="text-xs font-medium text-slate-700">{file ? file.name : 'Click to upload a PDF or .docx job description'}</span>
        {!file && <span className="text-[10px] text-slate-400">Max 15MB</span>}
        <input
          type="file"
          accept=".pdf,.docx,application/pdf"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setJustUploaded(null) }}
        />
      </label>

      <button
        onClick={upload}
        disabled={uploading || !file}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        {uploading ? 'Uploading…' : 'Upload Description'}
      </button>

      {justUploaded && (
        <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 pop-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-emerald-800">Uploaded successfully — done!</div>
            {(justUploaded.position || justUploaded.commitment) && (
              <div className="text-xs text-emerald-700 mt-1">
                {[
                  justUploaded.position,
                  justUploaded.commitment && `${justUploaded.commitment === 'PT' ? 'Part-Time' : 'Full-Time'}${justUploaded.weeklyHours ? ` (${justUploaded.weeklyHours}h/wk)` : ''}`,
                  justUploaded.weeks && `${justUploaded.weeks} weeks`,
                ].filter(Boolean).join(' · ')}
              </div>
            )}
            {justUploaded.extractedSkills?.length > 0 ? (
              <div className="text-xs text-emerald-700 mt-1">
                Added {justUploaded.extractedSkills.length} skill{justUploaded.extractedSkills.length === 1 ? '' : 's'} to your needs: {justUploaded.extractedSkills.join(', ')}
              </div>
            ) : (
              <div className="text-xs text-emerald-700 mt-1">Document saved.</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Uploaded Documents ({descriptions?.length || 0})
        </div>
        {!descriptions?.length ? (
          <div className="text-[11px] text-slate-400 italic">No internship descriptions uploaded yet.</div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {descriptions.map((d) => (
              <div key={d.id} className="border border-slate-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900 truncate">{d.position || d.fileName}</div>
                  <div className="text-[10px] text-slate-400 shrink-0">{new Date(d.uploadedAt).toLocaleDateString()}</div>
                </div>
                {(d.commitment || d.weeks) && (
                  <div className="text-[11px] text-qstp-700 mt-0.5">
                    {[
                      d.commitment && `${d.commitment === 'PT' ? 'Part-Time' : 'Full-Time'}${d.weeklyHours ? ` · ${d.weeklyHours}h/wk` : ''}`,
                      d.weeks && `${d.weeks} weeks`,
                    ].filter(Boolean).join(' · ')}
                  </div>
                )}
                {d.summary && <div className="text-[11px] text-slate-500 mt-1">{d.summary}</div>}
                {d.extractedSkills?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {d.extractedSkills.map((s) => (
                      <span key={s} className="text-[10px] bg-qstp-50 text-qstp-700 border border-qstp-100 rounded-full px-1.5 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
