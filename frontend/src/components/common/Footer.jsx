import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">© 2026 Qatar Science &amp; Technology Park · Member of Qatar Foundation</div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-qstp-500" />
          powered by <span className="font-semibold text-slate-800">Dino - mites</span>
        </div>
      </div>
    </footer>
  )
}
