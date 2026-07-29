import type { Alert } from '../../types'
import { alertSeverityColorClasses, alertSeverityIcon } from '../../lib/alerts'

interface ToastContainerProps {
  toasts: Alert[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-surface-3 bg-surface-1 px-4 py-3 shadow-xl"
        >
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-xs ${alertSeverityColorClasses(toast.severity)}`}
            aria-hidden="true"
          >
            {alertSeverityIcon(toast.severity)}
          </span>
          <p className="flex-1 text-sm text-slate-200">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
