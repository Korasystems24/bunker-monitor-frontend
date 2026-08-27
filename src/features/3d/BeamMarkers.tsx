import { useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { BunkerGeometry, ParsedBeam } from '../../types'
import { BEAM_AXES, BEAM_POSITIONS, FALLBACK_BUNKER_SHAPE } from '../../config'
import { resolveBeamXY, maxBeamRadius } from '../../lib/geometryUtils'
import { heightToColor, computeHeightRange } from '../../lib/colorScale'
import { buildSurfaceGrid } from '../../lib/interpolateSurface'
import { BeamTooltip } from '../dashboard/BeamTooltip'
import { hasUsableHeight } from '../../lib/parseMeasurement'

interface BeamMarkersProps {
  beams: ParsedBeam[]
  geometry: BunkerGeometry | undefined
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
}

const MARKER_RADIUS = 0.06

/**
 * One marker per beam, positioned at its real (or fallback) x/y and at its
 * measured height. Reliable beams render as solid coloured spheres; unreliable
 * ones as translucent wireframe octahedra — a distinct shape, not just a dimmer
 * colour, per the project's colourblind-accessibility rule. Click selects a
 * beam (synced with the 2D grid); hover/selection shows the shared tooltip.
 */
export function BeamMarkers({ beams, geometry, selectedBeam, onSelectBeam }: BeamMarkersProps) {
  const [hoveredBeam, setHoveredBeam] = useState<string | null>(null)

  const beamMap = useMemo(() => {
    const map = new Map<string, ParsedBeam>()
    beams.forEach((b) => map.set(b.beam_name, b))
    return map
  }, [beams])

  const heightRange = useMemo(
    () => computeHeightRange(beams.filter(hasUsableHeight).map((b) => b.height)),
    [beams],
  )

  const fallbackMaxRadius = geometry
    ? maxBeamRadius(geometry)
    : FALLBACK_BUNKER_SHAPE.top_diameter_m / 2

  // Same interpolated grid the ore surface itself is built from — so an
  // unreliable beam's marker/label sits on the surface right beneath it
  // instead of dropping to the bunker floor (height=0 doesn't mean "no ore").
  const grid = useMemo(() => buildSurfaceGrid(beams), [beams])

  const markers = useMemo(
    () =>
      BEAM_AXES.flatMap((axis, a) =>
        BEAM_POSITIONS.map((position, p) => {
          const beamName = `${axis}${position}`
          const beam = beamMap.get(beamName)
          const { x, y } = resolveBeamXY(axis, position, geometry, fallbackMaxRadius)
          const worldHeight = beam && hasUsableHeight(beam) ? beam.height : grid[a][p].height
          return { beamName, beam, x, y, worldHeight }
        }),
      ),
    [beamMap, geometry, fallbackMaxRadius, grid],
  )

  const displayBeamName = hoveredBeam ?? selectedBeam
  const displayMarker = markers.find((m) => m.beamName === displayBeamName)

  return (
    <group>
      {markers.map(({ beamName, beam, x, y, worldHeight }) => {
        const isSelected = selectedBeam === beamName
        let color = '#4b5563'
        if (beam && hasUsableHeight(beam)) {
          const norm =
            heightRange.max === heightRange.min
              ? 0.5
              : (beam.height - heightRange.min) / (heightRange.max - heightRange.min)
          color = heightToColor(norm)
        }

        return (
          <mesh
            key={beamName}
            position={[x, worldHeight, y]}
            scale={isSelected ? 1.7 : 1}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              onSelectBeam(isSelected ? null : beamName)
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              setHoveredBeam(beamName)
            }}
            onPointerOut={() => setHoveredBeam((h) => (h === beamName ? null : h))}
          >
            {beam?.reliable ? (
              <sphereGeometry args={[MARKER_RADIUS, 12, 12]} />
            ) : (
              <octahedronGeometry args={[MARKER_RADIUS * 1.3, 0]} />
            )}
            <meshStandardMaterial
              color={color}
              wireframe={!beam?.reliable}
              transparent={!beam?.reliable}
              opacity={beam?.reliable ? 1 : 0.6}
              emissive={isSelected ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.6 : 0}
            />
          </mesh>
        )
      })}

      {/* Beam name tags — always visible, so beams can be identified without hovering */}
      {markers.map(({ beamName, x, y, worldHeight }) => {
        const isHighlighted = beamName === selectedBeam || beamName === hoveredBeam
        return (
          <Html
            key={`label-${beamName}`}
            position={[x, worldHeight + MARKER_RADIUS * 2.5, y]}
            style={{ pointerEvents: 'none' }}
            center
          >
            <span
              className={`whitespace-nowrap font-mono text-[14px] text-white ${
                isHighlighted ? 'font-semibold' : ''
              }`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {beamName}
            </span>
          </Html>
        )
      })}

      {displayMarker?.beam && (
        <Html
          position={[
            displayMarker.x,
            displayMarker.worldHeight + MARKER_RADIUS * 6,
            displayMarker.y,
          ]}
          style={{ pointerEvents: 'none' }}
          center
        >
          <BeamTooltip beam={displayMarker.beam} />
        </Html>
      )}
    </group>
  )
}
