import { useMemo } from 'react'
import type { Measurement } from '../../types'
import { parseBeam } from '../../lib/parseMeasurement'
import { BeamTable } from './BeamTable'
import { ShowAllBeamsToggle } from './ShowAllBeamsToggle'
import { Skeleton } from '../../components/Skeleton'

interface BeamTablePanelProps {
  measurement: Measurement | undefined
  isLoading: boolean
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
  showAllExceptDisabled: boolean
  onShowAllExceptDisabledChange: (checked: boolean) => void
}

export function BeamTablePanel({
  measurement,
  isLoading,
  selectedBeam,
  onSelectBeam,
  showAllExceptDisabled,
  onShowAllExceptDisabledChange,
}: BeamTablePanelProps) {
  const parsedBeams = useMemo(() => (measurement?.beams ?? []).map(parseBeam), [measurement])

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1">
      <div className="flex items-center justify-between gap-3 border-b border-surface-3 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">64 луча</h2>
        <ShowAllBeamsToggle
          checked={showAllExceptDisabled}
          onChange={onShowAllExceptDisabledChange}
        />
      </div>

      <div className="p-4">
        {isLoading && parsedBeams.length === 0 ? (
          <Skeleton className="h-64 w-full" />
        ) : parsedBeams.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-600">Нет данных о лучах</p>
        ) : (
          <BeamTable
            beams={parsedBeams}
            selectedBeam={selectedBeam}
            onSelectBeam={onSelectBeam}
            showAllExceptDisabled={showAllExceptDisabled}
          />
        )}
      </div>
    </div>
  )
}
