import { useRef, useState } from 'react'
import { Eraser, Upload } from 'lucide-react'

export default function SignatureCapture({ onCapture, height = 160 }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)
  const [mode, setMode] = useState('draw') // 'draw' | 'upload'
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null)

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    hasStrokes.current = true
  }

  const stop = () => {
    if (drawing.current && hasStrokes.current) onCapture(canvasRef.current.toDataURL('image/png'))
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasStrokes.current = false
    onCapture(null)
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setUploadedDataUrl(reader.result); onCapture(reader.result) }
    reader.readAsDataURL(file)
  }

  const switchMode = (m) => {
    setMode(m)
    onCapture(m === 'draw' ? (hasStrokes.current ? canvasRef.current.toDataURL('image/png') : null) : uploadedDataUrl)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => switchMode('draw')}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${mode === 'draw' ? 'bg-qstp-500 text-white' : 'border border-slate-200 text-slate-600'}`}
        >
          Draw signature
        </button>
        <button
          type="button"
          onClick={() => switchMode('upload')}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${mode === 'upload' ? 'bg-qstp-500 text-white' : 'border border-slate-200 text-slate-600'}`}
        >
          Upload PNG
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <canvas
            ref={canvasRef}
            width={440}
            height={height}
            className="w-full border border-slate-200 rounded-lg bg-slate-50 touch-none cursor-crosshair"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={stop}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400">Draw your signature above.</p>
            <button type="button" onClick={clear} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1 text-slate-600">
              <Eraser className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl px-4 py-8 cursor-pointer hover:border-qstp-400 hover:bg-qstp-50/40 transition text-center">
          {uploadedDataUrl ? (
            <img src={uploadedDataUrl} alt="Uploaded signature" className="max-h-24 object-contain" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-qstp-600" />
              <span className="text-sm font-medium text-slate-700">Click to upload a signature PNG</span>
            </>
          )}
          <input type="file" accept="image/png" className="hidden" onChange={onFileChange} />
        </label>
      )}
    </div>
  )
}
