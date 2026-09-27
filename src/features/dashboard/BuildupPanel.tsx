import type { BuildupAnalysis } from '../../types'
import { sortZonesBySeverity, severityLabel, severityIcon, severityColorClasses } from '../../lib/buildupUtils'
import { formatTimestamp } from '../../lib/formatters'
import { Skeleton } from '../../components/Skeleton'

interface BuildupPanelProps {
  analysis: BuildupAnalysis | undefined
  isLoading: boolean
  countsAllExceptDisabled?: boolean
}

export function BuildupPanel({
  analysis,
  isLoading,
  countsAllExceptDisabled = false,
}: BuildupPanelProps) {
  const zones = analysis ? sortZonesBySeverity(analysis.zones) : []
  const suspectCount = zones.filter((z) => z.severity !== 'none').length

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1">
      <div className="flex items-center justify-between border-b border-surface-3 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Налипания на боковых стенках
        </h2>
        {analysis && (
          <span className="text-xs text-slate-500">
            {suspectCount > 0 ? (
              <span className="text-amber-400">{suspectCount} ось(ей) под подозрением</span>
            ) : (
              <span>Аномалий не обнаружено</span>
            )}
            {' · '}
            обновлено {formatTimestamp(analysis.ts)}
          </span>
        )}
      </div>

      <div className="p-2">
        {isLoading && !analysis ? (
          <Skeleton className="h-40 w-full" />
        ) : zones.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">Нет данных для анализа</p>
        ) : (
          <ul className="divide-y divide-surface-3">
            {zones.map((zone) => (
              <li key={zone.axis} className="flex flex-wrap items-center gap-3 px-2 py-2">
                <span className="w-6 shrink-0 font-mono text-sm font-bold text-slate-200">
                  {zone.axis}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs ${severityColorClasses(zone.severity)}`}
                >
                  <span aria-hidden="true">{severityIcon(zone.severity)}</span>
                  {severityLabel(zone.severity)}
                </span>

                <span className="text-xs tabular-nums text-slate-500">
                  откл. {zone.deviation_m >= 0 ? '+' : ''}
                  {zone.deviation_m.toFixed(2)} м
                </span>

                {zone.affected_positions.length > 0 && (
                  <span className="text-xs text-slate-500">
                    поз. {zone.affected_positions.join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="border-t border-surface-3 px-4 py-2 text-[11px] leading-snug text-slate-600">
        Критерий детекции — предварительный (аномалия высоты во внешних позициях спицы
        относительно профиля оси), уточняется с заказчиком. Порог задаёт бэкенд, не фронт.
        {countsAllExceptDisabled &&
          ' В расчёт входят все лучи замера, кроме статуса Disabled.'}
      </p>
    </div>
  )
}
