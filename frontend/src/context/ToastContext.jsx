import { createContext, useCallback, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

export const ToastContext = createContext(null)

const STYLES = {
  success: { bg: 'bg-emerald-600', Icon: CheckCircle },
  error: { bg: 'bg-rose-600', Icon: XCircle },
  info: { bg: 'bg-qstp-600', Icon: Info },
  warn: { bg: 'bg-amber-500', Icon: AlertTriangle },
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[80] space-y-2">
        {toasts.map(({ id, msg, type }) => {
          const { bg, Icon } = STYLES[type] || STYLES.success
          return (
            <div key={id} className={`toast-in ${bg} text-white text-sm px-4 py-3 rounded-xl shadow-soft flex items-center gap-2 max-w-sm`}>
              <Icon className="w-4 h-4" />
              <span>{msg}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
