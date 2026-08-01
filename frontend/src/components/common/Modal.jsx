import { X } from 'lucide-react'

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

export default function Modal({ title, size = 'md', onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-start md:items-center justify-center p-4 fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white w-full ${SIZES[size]} rounded-2xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
