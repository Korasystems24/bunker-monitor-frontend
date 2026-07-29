import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BunkerStats } from '../../types'
import { UNITS } from '../../config'
import { formatDateTimeShort } from '../../lib/formatters'

interface Props {
  stats: BunkerStats
}

function LevelTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const order = ['max_level', 'avg_level', 'min_level']
  const sorted = [...payload].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  return (
    <div className="rounded border border-surface-3 bg-surface-1 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-slate-400">{label ? formatDateTimeShort(label) : ''}</div>
      {sorted.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {LEVEL_META[p.name as keyof typeof LEVEL_META]?.label ?? p.name}:{' '}
          <span className="font-semibold tabular-nums">
            {p.value.toFixed(2)} {UNITS.level}
          </span>
        </div>
      ))}
    </div>
  )
}

const LEVEL_META = {
  min_level: { label: 'Минимум', color: '#60a5fa' },
  avg_level: { label: 'Среднее', color: '#34d399' },
  max_level: { label: 'Максимум', color: '#fb923c' },
} as const

export function LevelChart({ stats }: Props) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-300">
        Уровень руды, {UNITS.level}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={stats.series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="ts"
            tickFormatter={formatDateTimeShort}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            minTickGap={60}
          />
          <YAxis
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<LevelTooltip />} />
          <Legend
            formatter={(value) => LEVEL_META[value as keyof typeof LEVEL_META]?.label ?? value}
            iconType="plainline"
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="max_level"
            stroke={LEVEL_META.max_level.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="avg_level"
            stroke={LEVEL_META.avg_level.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="min_level"
            stroke={LEVEL_META.min_level.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
