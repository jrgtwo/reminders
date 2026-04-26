import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useToastStore, type ToastKind } from '../../store/toast.store'

const ICONS: Record<ToastKind, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}

const STYLES: Record<ToastKind, string> = {
  info: 'bg-[var(--bg-elevated)] border-slate-200 dark:border-white/10 text-gray-800 dark:text-gray-100',
  warning:
    'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-100',
  error:
    'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 text-red-900 dark:text-red-100',
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-[calc(100%-2rem)] pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind]
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto ${STYLES[t.kind]}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">{t.message}</div>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
