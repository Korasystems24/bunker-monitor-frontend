import { useMemo } from 'react'
import type { Measurement, BuildupZone } from '../../types'
import type { BunkerGeometry } from '../../types'
import { parseBeam } from '../../lib/parseMeasurement'
import { RadialBeamGrid } from './RadialBeamGrid'
import { Skeleton } from '../../components/Skeleton'

interface RadialGridPanelProps {
  measurement: Measurement | undefined
  geometry: BunkerGeometry | undefined
  isLoading: boolean
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
  buildupZones?: BuildupZone[]
  showAllExceptDisabled?: boolean
}

export function RadialGridPanel({
  measurement,
  geometry,
  isLoading,
  selectedBeam,
  onSelectBeam,
  buildupZones,
  showAllExceptDisabled = false,
}: RadialGridPanelProps) {
  const parsedBeams = useMemo(() => (measurement?.beams ?? []).map(parseBeam), [measurement])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-surface-3 bg-surface-1">
      <div className="flex shrink-0 items-center justify-between border-b border-surface-3 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Радиальное отображение
        </h2>
        {!geometry && (
          <span className="text-xs text-amber-600">резервная раскладка (нет /geometry)</span>
        )}
      </div>

      <div className="min-h-0 flex-1 p-4">
        {isLoading && parsedBeams.length === 0 ? (
          <Skeleton className="h-full w-full rounded-full" />
        ) : parsedBeams.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600">
            Нет данных о лучах
          </p>
        ) : (
          <RadialBeamGrid
            beams={parsedBeams}
            geometry={geometry}
            selectedBeam={selectedBeam}
            onSelectBeam={onSelectBeam}
            buildupZones={buildupZones}
            showAllExceptDisabled={showAllExceptDisabled}
          />
        )}
      </div>
    </div>
  )
}
