import type { BunkerStats } from '../../types'
import { UNITS } from '../../config'

interface Props {
  stats: BunkerStats
}

export function PeriodSummary({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryCard label="Мин. уровень" value={stats.min_level} unit={UNITS.level} color="text-blue-400" />
      <SummaryCard label="Сред. уровень" value={stats.avg_level} unit={UNITS.level} color="text-sky-300" />
      <SummaryCard label="Макс. уровень" value={stats.max_level} unit={UNITS.level} color="text-blue-300" />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-surface-3 bg-surface-1 px-4 py-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${color}`}>
        {value.toFixed(2)}
        <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
      </span>
    </div>
  )
}
