import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { BunkerGeometry, Measurement } from '../../types'
import { hasUsableHeight, parseBeam } from '../../lib/parseMeasurement'
import { computeHeightRange } from '../../lib/colorScale'
import { maxShapeHorizontalExtent } from '../../lib/geometryUtils'
import { FALLBACK_BUNKER_SHAPE, FALLBACK_SENSOR } from '../../config'
import { BunkerShape } from './BunkerShape'
import { OreSurface } from './OreSurface'
import { BeamMarkers } from './BeamMarkers'
import { SensorMarker } from './SensorMarker'
import { HeightLegend } from '../../components/HeightLegend'
import { Skeleton } from '../../components/Skeleton'

interface Scene3DPanelProps {
  measurement: Measurement | undefined
  geometry: BunkerGeometry | undefined
  isLoading: boolean
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
}

export function Scene3DPanel({
  measurement,
  geometry,
  isLoading,
  selectedBeam,
  onSelectBeam,
}: Scene3DPanelProps) {
  const parsedBeams = useMemo(() => (measurement?.beams ?? []).map(parseBeam), [measurement])

  const shape = geometry?.shape ?? FALLBACK_BUNKER_SHAPE
  const sensor = geometry?.sensor ?? FALLBACK_SENSOR

  const heightRange = useMemo(
    () =>
      computeHeightRange(
        parsedBeams.filter(hasUsableHeight).map((b) => b.height),
      ),
    [parsedBeams],
  )

  const maxExtent = maxShapeHorizontalExtent(shape)
  const camDist = maxExtent * 1.4

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-surface-3 bg-surface-1">
      <div className="flex shrink-0 items-center justify-between border-b border-surface-3 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          3D-модель бункера
        </h2>
        {!geometry && (
          <span className="text-xs text-amber-600">резервная раскладка (нет /geometry)</span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading && parsedBeams.length === 0 ? (
          <div className="h-full p-4">
            <Skeleton className="h-full w-full" />
          </div>
        ) : parsedBeams.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600">
            Нет данных о лучах
          </p>
        ) : (
          <Canvas camera={{ position: [camDist, shape.vessel_height_m * 1.1, camDist], fov: 45 }}>
            <color attach="background" args={['#0b1220']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={0.9} />

            <BunkerShape shape={shape} />
            <OreSurface beams={parsedBeams} geometry={geometry} />
            <BeamMarkers
              beams={parsedBeams}
              geometry={geometry}
              selectedBeam={selectedBeam}
              onSelectBeam={onSelectBeam}
            />
            <SensorMarker sensor={sensor} boresightLength={shape.vessel_height_m * 0.35} />

            <gridHelper args={[maxExtent * 2, 10, '#1e293b', '#1e293b']} />
            <OrbitControls
              makeDefault
              target={[0, shape.vessel_height_m / 2, 0]}
              minDistance={1.5}
              maxDistance={camDist * 4}
            />
          </Canvas>
        )}
      </div>

      <div className="shrink-0 border-t border-surface-3 px-4 py-2">
        <HeightLegend min={heightRange.min} max={heightRange.max} />
      </div>
    </div>
  )
}
