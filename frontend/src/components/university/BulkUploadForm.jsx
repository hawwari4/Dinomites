import { useRef, useState } from 'react'
import { Clipboard, Rocket, Upload } from 'lucide-react'
import { candidateApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'

const SAMPLE = [
  'Ahmed Al-Meer,28901234567,ahmed.meer@udst.edu.qa,Mechanical Engineering,FT,winter,MATLAB;SolidWorks;CAD',
  'Sara Ibrahim,29001234567,sara.i@udst.edu.qa,Interaction Design,PT,summer,Figma;UX Research;Prototyping',
  'Yousef Al-Kubaisi,28801234567,yousef.k@udst.edu.qa,Business Analytics,FT,fall,Excel;SQL;PowerBI',
].join('\n')

export default function BulkUploadForm({ universityName, onUploaded }) {
  const toast = useToast()
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast('Please choose a .csv file', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(String(reader.result || '').trim())
      setFileName(file.name)
      toast(`Loaded ${file.name}`, 'success')
    }
    reader.onerror = () => toast('Could not read that file', 'error')
    reader.readAsText(file)
  }

  const submit = async () => {
    if (!csvText.trim()) { toast('Paste CSV rows first', 'error'); return }
    setSubmitting(true)
    try {
      const { created, skippedRows } = await candidateApi.bulk({ universityName, csvText })
      toast(
        skippedRows
          ? `Bulk uploaded ${created.length} students (${skippedRows} row(s) skipped — check commitment/cycle values)`
          : `Bulk uploaded ${created.length} students`,
        skippedRows ? 'warn' : 'success'
      )
      setCsvText('')
      setFileName('')
      onUploaded()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Bulk upload failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Rocket className="w-5 h-5 text-qstp-600" /> Bulk Upload (CSV)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Push a batch of students at once. Format: name,qid,email,major,commitment,cycle,skills</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />Upload CSV file
          </button>
          <button onClick={() => { setCsvText(SAMPLE); setFileName('') }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
            <Clipboard className="w-3.5 h-3.5" />Paste sample
          </button>
        </div>
      </div>
      {fileName && <div className="mt-2 text-xs text-slate-500">Loaded from <span className="font-medium text-slate-700">{fileName}</span> — review below before processing.</div>}
      <textarea
        value={csvText}
        onChange={(e) => { setCsvText(e.target.value); setFileName('') }}
        rows={6}
        className="mt-3 w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg ring-focus"
        placeholder="Ahmed Al-Meer,28901234567,ahmed@udst.edu.qa,Mechanical Engineering,FT,winter,MATLAB;SolidWorks;CAD"
      />
      <div className="mt-3 flex justify-end">
        <button onClick={submit} disabled={submitting} className="text-sm px-4 py-2 rounded-lg bg-qstp-500 hover:bg-qstp-600 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1">
          <Rocket className="w-4 h-4" />{submitting ? 'Processing…' : 'Process Bulk Upload'}
        </button>
      </div>
    </div>
  )
}
