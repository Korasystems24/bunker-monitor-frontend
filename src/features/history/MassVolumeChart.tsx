import {
  ComposedChart,
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

function MassVolumeTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-surface-3 bg-surface-1 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-slate-400">{label ? formatDateTimeShort(label) : ''}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name === 'mass' ? 'Масса' : 'Объём'}:{' '}
          <span className="font-semibold">
            {p.value.toFixed(p.name === 'mass' ? 3 : 2)}{' '}
            {p.name === 'mass' ? UNITS.mass : UNITS.volume}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MassVolumeChart({ stats }: Props) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-300">
        Масса ({UNITS.mass}) и объём ({UNITS.volume})
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={stats.series} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="ts"
            tickFormatter={formatDateTimeShort}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            minTickGap={60}
          />
          {/* Left Y axis — mass */}
          <YAxis
            yAxisId="mass"
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#a78bfa', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            width={40}
          />
          {/* Right Y axis — volume */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#34d399', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<MassVolumeTooltip />} />
          <Legend
            formatter={(value) => (value === 'mass' ? `Масса, ${UNITS.mass}` : `Объём, ${UNITS.volume}`)}
            iconType="plainline"
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />
          <Line
            yAxisId="mass"
            type="monotone"
            dataKey="mass"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            name="mass"
            isAnimationActive={false}
          />
          <Line
            yAxisId="volume"
            type="monotone"
            dataKey="volume"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="volume"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
