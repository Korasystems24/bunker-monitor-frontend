import { useMemo } from 'react'
import type { Measurement } from '../../types'
import { parseBeam } from '../../lib/parseMeasurement'
import { formatLevel, formatVolume, formatMass, formatTimestamp } from '../../lib/formatters'
import { Skeleton } from '../../components/Skeleton'

interface StatItemProps {
  label: string
  value: string
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">{value}</span>
    </div>
  )
}

interface VesselPanelProps {
  measurement: Measurement | undefined
  bunkerName: string
  online: boolean
  isLoading: boolean
}

export function VesselPanel({ measurement, bunkerName, online, isLoading }: VesselPanelProps) {
  const minMax = useMemo(() => {
    if (!measurement) return null
    const parsed = measurement.beams.map(parseBeam)
    const reliableHeights = parsed.filter((b) => b.reliable && b.height > 0).map((b) => b.height)
    return {
      minLevel: reliableHeights.length ? Math.min(...reliableHeights) : null,
      maxLevel: reliableHeights.length ? Math.max(...reliableHeights) : null,
    }
  }, [measurement])

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-surface-3 bg-surface-1 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-200">{bunkerName}</h1>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
            online ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`}
            aria-hidden="true"
          />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      {isLoading && !measurement ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <StatItem label="Средний уровень" value={formatLevel(measurement?.avg_level)} />
          <StatItem label="Мин. уровень" value={formatLevel(minMax?.minLevel)} />
          <StatItem label="Макс. уровень" value={formatLevel(minMax?.maxLevel)} />
          <StatItem label="Объём" value={formatVolume(measurement?.volume)} />
          <StatItem label="Масса" value={formatMass(measurement?.mass)} />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Последний замер</span>
            <span className="text-sm font-mono text-slate-300 tabular-nums">
              {formatTimestamp(measurement?.ts)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
