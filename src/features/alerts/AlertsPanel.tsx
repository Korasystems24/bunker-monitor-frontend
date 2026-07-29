import { Link } from 'react-router-dom'
import type { Alert } from '../../types'
import { alertSeverityColorClasses, alertSeverityIcon } from '../../lib/alerts'
import { formatRelativeTime } from '../../lib/formatters'

interface AlertsPanelProps {
  alerts: Alert[]
  onNavigate?: () => void
}

export function AlertsPanel({ alerts, onNavigate }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return <p className="p-4 text-center text-sm text-slate-500">Активных алертов нет</p>
  }

  return (
    <ul className="max-h-96 divide-y divide-surface-3 overflow-y-auto">
      {alerts.map((alert) => {
        const row = (
          <div className="flex items-start gap-2.5 px-4 py-3 text-left">
            <span
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs ${alertSeverityColorClasses(alert.severity)}`}
              aria-hidden="true"
            >
              {alertSeverityIcon(alert.severity)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">{alert.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(alert.ts)}</p>
            </div>
          </div>
        )
        return (
          <li key={alert.id}>
            {alert.bunkerId ? (
              <Link
                to={`/bunkers/${alert.bunkerId}`}
                onClick={onNavigate}
                className="block transition-colors hover:bg-surface-2"
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        )
      })}
    </ul>
  )
}
