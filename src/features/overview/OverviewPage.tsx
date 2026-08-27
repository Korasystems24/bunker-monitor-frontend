import { Link } from 'react-router-dom'
import {
  useBunkers,
  useHealth,
  useAllLatestMeasurements,
  useAllBuildup,
  byBunkerId,
} from '../../api/hooks'
import { summarizeBeamHealth } from '../../lib/parseMeasurement'
import { sortZonesBySeverity, severityLabel, severityColorClasses } from '../../lib/buildupUtils'
import { formatLevel, formatVolume, formatMass, formatRelativeTime } from '../../lib/formatters'
import { Skeleton } from '../../components/Skeleton'
import { ErrorMessage } from '../../components/ErrorMessage'
import type { BunkerInfo, Measurement, BuildupAnalysis } from '../../types'

export function OverviewPage() {
  const { data: bunkers, isLoading, error, refetch } = useBunkers()
  const { data: health } = useHealth()
  const measurementResults = useAllLatestMeasurements(bunkers)
  const buildupResults = useAllBuildup(bunkers)

  const measurementsByBunker = byBunkerId(bunkers, measurementResults)
  const buildupByBunker = byBunkerId(bunkers, buildupResults)

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage
          message="Не удалось загрузить список бункеров. Backend недоступен."
          retry={() => void refetch()}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="mb-4 text-base font-semibold text-slate-200">Обзор бункеров</h2>

      {isLoading && !bunkers ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bunkers?.map((bunker) => (
            <BunkerCard
              key={bunker.id}
              bunker={bunker}
              measurement={measurementsByBunker[bunker.id]}
              buildup={buildupByBunker[bunker.id]}
            />
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-8 text-base font-semibold text-slate-200">Edge-узлы</h2>
      {!health ? (
        <Skeleton className="h-20 w-full" />
      ) : health.edge_pcs.length === 0 ? (
        <p className="text-sm text-slate-600">Нет данных об Edge-узлах</p>
      ) : (
        <div className="flex flex-col gap-2">
          {health.edge_pcs.map((node) => (
            <div
              key={node.node_id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-surface-3 bg-surface-1 px-4 py-3"
            >
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
                  node.online ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${node.online ? 'bg-green-400' : 'bg-red-400'}`}
                  aria-hidden="true"
                />
                {node.online ? 'Online' : 'Offline'}
              </span>
              <span className="font-mono text-sm text-slate-200">{node.node_id}</span>
              <span className="text-xs text-slate-500">CPU {node.cpu.toFixed(0)}%</span>
              <span className="text-xs text-slate-500">RAM {node.ram.toFixed(0)}%</span>
              <span className="text-xs text-slate-500">Диск {node.disk.toFixed(0)}%</span>
              <span className="ml-auto text-xs text-slate-500">
                Пульс: {formatRelativeTime(node.last_pulse)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface BunkerCardProps {
  bunker: BunkerInfo
  measurement: Measurement | undefined
  buildup: BuildupAnalysis | undefined
}

function BunkerCard({ bunker, measurement, buildup }: BunkerCardProps) {
  const health = measurement ? summarizeBeamHealth(measurement.beams) : null
  const worstZone = buildup ? sortZonesBySeverity(buildup.zones)[0] : undefined
  const hasBuildupSuspicion = worstZone && worstZone.severity !== 'none'

  return (
    <Link
      to={`/bunkers/${bunker.id}`}
      className="flex flex-col gap-3 rounded-lg border border-surface-3 bg-surface-1 p-4 transition-colors hover:border-blue-700"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{bunker.name}</h3>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            bunker.online ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${bunker.online ? 'bg-green-400' : 'bg-red-400'}`}
            aria-hidden="true"
          />
          {bunker.online ? 'Online' : 'Offline'}
        </span>
      </div>

      {!measurement ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Stat label="Ср. уровень" value={formatLevel(measurement.avg_level)} />
          <Stat label="Объём" value={formatVolume(measurement.volume)} />
          <Stat label="Масса" value={formatMass(measurement.mass)} />
          <Stat label="Замер" value={formatRelativeTime(measurement.ts)} />
        </div>
      )}

      {health && (
        <div className="text-xs text-slate-500">
          Лучи: <span className="text-green-400">{health.valid}</span> достоверных,{' '}
          <span className="text-yellow-400">{health.degraded}</span> деградация,{' '}
          <span className="text-slate-400">{health.disabled}</span> откл.
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-surface-3 pt-2 text-xs">
        <span className="text-slate-500">Налипания:</span>
        {worstZone ? (
          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${severityColorClasses(worstZone.severity)}`}
          >
            {severityLabel(worstZone.severity)}
          </span>
        ) : (
          <span className="text-slate-600">нет данных</span>
        )}
        {hasBuildupSuspicion && (
          <span className="ml-auto text-amber-400">
            {buildup?.zones.filter((z) => z.severity !== 'none').length} ось(ей)
          </span>
        )}
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  )
}
