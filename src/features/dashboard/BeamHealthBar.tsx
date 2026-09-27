import { useMemo } from 'react'
import type { Measurement } from '../../types'
import { summarizeBeamHealth } from '../../lib/parseMeasurement'

interface BeamHealthBarProps {
  measurement: Measurement | undefined
  showAllExceptDisabled?: boolean
}

export function BeamHealthBar({
  measurement,
  showAllExceptDisabled = false,
}: BeamHealthBarProps) {
  const stats = useMemo(() => {
    if (!measurement) return null
    return summarizeBeamHealth(measurement.beams, { showAllExceptDisabled })
  }, [measurement, showAllExceptDisabled])

  if (!stats) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-4 py-3">
      <BeamBadge label="Достоверных" count={stats.valid} total={64} color="green" />
      <BeamBadge label="Деградация" count={stats.degraded} total={64} color="yellow" />
      <BeamBadge label="Отключено" count={stats.disabled} total={64} color="gray" />
      <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
        <span className="text-slate-400">Бок. зоны:</span>
        <span className={stats.outerValid < stats.outerTotal / 2 ? 'text-yellow-400' : 'text-green-400'}>
          {stats.outerValid}/{stats.outerTotal}
        </span>
      </div>
    </div>
  )
}

interface BeamBadgeProps {
  label: string
  count: number
  total: number
  color: 'green' | 'yellow' | 'gray'
}

function BeamBadge({ label, count, total, color }: BeamBadgeProps) {
  const colorMap = {
    green: 'bg-green-900/40 text-green-300 border-green-800/50',
    yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
    gray: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs ${colorMap[color]}`}>
      <span className="font-semibold tabular-nums">{count}</span>
      <span className="text-slate-500">/</span>
      <span className="tabular-nums">{total}</span>
      <span>{label}</span>
    </span>
  )
}
