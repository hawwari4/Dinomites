import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-10">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  )
}
