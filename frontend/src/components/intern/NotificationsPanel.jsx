import { MessageCircleQuestion, FileSignature } from 'lucide-react'
import { initials, daysAgo } from '../../utils/helpers'
import { notificationApi } from '../../api/endpoints'

export default function NotificationsPanel({ notifications, onRead }) {
  const items = notifications || []

  const openOne = async (n) => {
    if (n.read) return
    await notificationApi.markRead(n.id)
    onRead?.()
  }

  if (!items.length) {
    return <div className="text-sm text-slate-500">No notifications yet.</div>
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl max-h-72 overflow-y-auto">
      {items.map((n) => {
        const age = daysAgo(n.createdAt)
        const fromAdmin = !n.startupId
        return (
          <button
            key={n.id}
            onClick={() => openOne(n)}
            className="w-full p-3.5 flex items-start gap-3 text-left hover:bg-slate-50 transition"
          >
            <div className={`w-9 h-9 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${
              fromAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-qstp-100 text-qstp-700'
            }`}>
              {fromAdmin ? <FileSignature className="w-4 h-4" /> : initials(n.startupName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                {n.startupName}
                {!n.read && <span className="w-2 h-2 rounded-full bg-qstp-500 shrink-0" />}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
              <div className="text-[11px] text-slate-400 mt-1">{age == null ? '' : age === 0 ? 'Today' : `${age}d ago`}</div>
            </div>
            {fromAdmin ? (
              <FileSignature className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            ) : (
              <MessageCircleQuestion className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
