import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const BADGES = {
  intern: { label: 'Intern', cls: 'bg-qstp-50 text-qstp-700 border-qstp-100' },
  university: { label: 'University', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
  startup: { label: 'Startup', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  admin: { label: 'QSTP Admin', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  if (!user) return null
  const badge = BADGES[user.role] || { label: user.role || 'User', cls: 'bg-slate-50 text-slate-700 border-slate-100' }

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl qstp-dots shadow-soft" />
          <div>
            <div className="text-base font-bold leading-none text-slate-900">QSTP Connect</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {user.role === 'admin' ? user.org : user.company || user.org || 'Talent Portal'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-1 ${badge.cls}`}>
            {badge.label}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-qstp-700 text-white grid place-items-center text-xs font-semibold">
              {user.avatar}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-none">{user.name}</div>
              <div className="text-[11px] text-slate-500 leading-none mt-0.5">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
