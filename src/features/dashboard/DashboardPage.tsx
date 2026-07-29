import { useState, Suspense, lazy } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useBunkers, useLatestMeasurement, useGeometry, useBuildup } from '../../api/hooks'
import { VesselPanel } from './VesselPanel'
import { BeamTablePanel } from './BeamTablePanel'
import { RadialGridPanel } from './RadialGridPanel'
import { BeamHealthBar } from './BeamHealthBar'
import { BuildupPanel } from './BuildupPanel'
import { ErrorMessage } from '../../components/ErrorMessage'
import { Skeleton } from '../../components/Skeleton'

// three.js/r3f are heavy — keep them out of the main bundle until the dashboard actually renders
const Scene3DPanel = lazy(() =>
  import('../3d/Scene3DPanel').then((m) => ({ default: m.Scene3DPanel })),
)

export function DashboardPage() {
  const { bunkerId } = useParams<{ bunkerId: string }>()
  const activeBunkerId = bunkerId ?? ''

  const {
    data: bunkers,
    isLoading: bunkersLoading,
    error: bunkersError,
    refetch: refetchBunkers,
  } = useBunkers()

  const [selectedBeam, setSelectedBeam] = useState<string | null>(null)

  const {
    data: measurement,
    isLoading: measurementLoading,
    error: measurementError,
  } = useLatestMeasurement(activeBunkerId)

  const { data: geometry } = useGeometry(activeBunkerId)
  const { data: buildup, isLoading: buildupLoading } = useBuildup(activeBunkerId)

  const activeBunker = bunkers?.find((b) => b.id === activeBunkerId)

  if (bunkersError) {
    return (
      <div className="p-8">
        <ErrorMessage
          message="Не удалось загрузить список бункеров. Проверьте, запущен ли мок-сервер."
          retry={() => void refetchBunkers()}
        />
      </div>
    )
  }

  // Unknown bunkerId in the URL (e.g. stale link, typo) once the bunkers list has loaded
  if (!bunkersLoading && bunkers && !activeBunker) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Loading state for first bunker load */}
      {bunkersLoading && !bunkers && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[500px_1fr]">
          <Skeleton className="h-48" />
          <Skeleton className="h-[500px]" />
        </div>
      )}

      {activeBunkerId && (
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[500px_1fr]">
          {/* Left: vessel readings */}
          <div className="flex flex-col gap-4">
            <VesselPanel
              measurement={measurement}
              bunkerName={activeBunker?.name ?? activeBunkerId}
              online={activeBunker?.online ?? false}
              isLoading={measurementLoading}
            />

            {measurementError && <ErrorMessage message="Нет данных замеров. Сервер недоступен." />}

            <div className="mt-auto">
              <BeamHealthBar measurement={measurement} />
            </div>
          </div>

          {/* Right: beam table (always visible) */}
          <BeamTablePanel
            measurement={measurement}
            isLoading={measurementLoading}
            selectedBeam={selectedBeam}
            onSelectBeam={setSelectedBeam}
          />
        </div>
      )}

      {/* Radial grid + 3D model — side by side, equal height, half the viewport */}
      {activeBunkerId && (
        <div className="grid h-[50vh] min-h-[420px] grid-cols-1 gap-4 md:grid-cols-2">
          <RadialGridPanel
            measurement={measurement}
            geometry={geometry}
            isLoading={measurementLoading}
            selectedBeam={selectedBeam}
            onSelectBeam={setSelectedBeam}
            buildupZones={buildup?.zones}
          />

          <Suspense fallback={<Skeleton className="h-full" />}>
            <Scene3DPanel
              measurement={measurement}
              geometry={geometry}
              isLoading={measurementLoading}
              selectedBeam={selectedBeam}
              onSelectBeam={setSelectedBeam}
            />
          </Suspense>
        </div>
      )}

      {activeBunkerId && <BuildupPanel analysis={buildup} isLoading={buildupLoading} />}
    </div>
  )
}
