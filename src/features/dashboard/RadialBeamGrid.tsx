import { useMemo, useState, useRef } from 'react'
import type { ParsedBeam, BuildupZone } from '../../types'
import type { BunkerGeometry } from '../../types'
import { BEAM_AXES, BEAM_POSITIONS, FALLBACK_GEOMETRY, OUTER_ZONE_POSITION_THRESHOLD } from '../../config'
import { heightToColor, computeHeightRange } from '../../lib/colorScale'
import { formatLevel } from '../../lib/formatters'
import { resolveBeamXY, maxBeamRadius } from '../../lib/geometryUtils'
import { severitySvgColor, severityIcon, severityLabel } from '../../lib/buildupUtils'
import { BeamTooltip } from './BeamTooltip'
import { HeightLegend } from '../../components/HeightLegend'
import { hasDisplayHeight, isBeamDisabled } from '../../lib/parseMeasurement'

interface RadialBeamGridProps {
  beams: ParsedBeam[]
  geometry: BunkerGeometry | undefined
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
  buildupZones?: BuildupZone[]
  showAllExceptDisabled?: boolean
}

const SVG_SIZE = 440
const CENTER = SVG_SIZE / 2
const MAX_RADIUS = 190

/**
 * Map beam to (x, y) in SVG space.
 * Uses geometry from /geometry endpoint when available, falls back to default radial layout.
 */
function beamToSvgCoords(
  axis: string,
  position: number,
  geometry: BunkerGeometry | undefined,
): { x: number; y: number } {
  if (geometry) {
    // Geometry has real-world x/y; normalise to SVG space
    const maxR = maxBeamRadius(geometry)
    const { x: rx, y: ry } = resolveBeamXY(axis, position, geometry, maxR)
    const nx = rx / maxR
    const ny = ry / maxR
    return {
      x: CENTER + nx * MAX_RADIUS,
      y: CENTER - ny * MAX_RADIUS, // SVG y-axis is inverted
    }
  }

  // Fallback uniform radial layout — resolveBeamXY returns already-scaled (x, y) here
  const { x: fx, y: fy } = resolveBeamXY(axis, position, undefined, MAX_RADIUS)
  return {
    x: CENTER + fx,
    y: CENTER - fy,
  }
}

export function RadialBeamGrid({
  beams,
  geometry,
  selectedBeam,
  onSelectBeam,
  buildupZones = [],
  showAllExceptDisabled = false,
}: RadialBeamGridProps) {
  const [hoveredBeam, setHoveredBeam] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const beamMap = useMemo(() => {
    const map = new Map<string, ParsedBeam>()
    beams.forEach((b) => map.set(b.beam_name, b))
    return map
  }, [beams])

  const buildupByAxis = useMemo(() => {
    const map = new Map<string, BuildupZone>()
    buildupZones.forEach((z) => map.set(z.axis, z))
    return map
  }, [buildupZones])

  const heightRange = useMemo(() => {
    const heights = beams
      .filter((beam) => hasDisplayHeight(beam, showAllExceptDisabled))
      .map((b) => b.height)
    return computeHeightRange(heights)
  }, [beams, showAllExceptDisabled])

  const hoveredBeamData = hoveredBeam ? beamMap.get(hoveredBeam) : null

  function handleMouseMove(e: React.MouseEvent<SVGCircleElement>, beamName: string) {
    setHoveredBeam(beamName)
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  return (
    <div className="relative flex h-full flex-col select-none">
      <div className="min-h-0 flex-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="h-full w-full"
          // Severity icons sit just past the viewBox edge for the vertical/horizontal axes
          // (C/G/A/E) — the outer flex-1 div still has room via the panel's own padding, but
          // an SVG clips anything outside its viewBox by default unless overflow is opened up.
          style={{ overflow: 'visible' }}
          aria-label="Радиальная сетка лучей"
        >
          {/* Background circles (rings) */}
          {BEAM_POSITIONS.map((pos) => {
            const r = MAX_RADIUS * (FALLBACK_GEOMETRY.radiusFractions[pos - 1] ?? 0.5)
            return (
              <circle
                key={pos}
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="#1e2a3a"
                strokeWidth="1"
              />
            )
          })}

          {/* Axis lines (spokes) */}
          {BEAM_AXES.map((axis, idx) => {
            const azimuthDeg = FALLBACK_GEOMETRY.azimuthStep_deg * idx
            const azimuthRad = (azimuthDeg * Math.PI) / 180
            const ex = CENTER + MAX_RADIUS * Math.cos(azimuthRad)
            const ey = CENTER - MAX_RADIUS * Math.sin(azimuthRad)
            return (
              <g key={axis}>
                <line x1={CENTER} y1={CENTER} x2={ex} y2={ey} stroke="#1e2a3a" strokeWidth="1" />
                {/* Axis label */}
                {(() => {
                  const lr = MAX_RADIUS + 16
                  const lx = CENTER + lr * Math.cos(azimuthRad)
                  const ly = CENTER - lr * Math.sin(azimuthRad)
                  const zone = buildupByAxis.get(axis)
                  const flagged = zone && zone.severity !== 'none'
                  return (
                    <g>
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="22"
                        fontFamily="monospace"
                      >
                        {axis}
                      </text>
                      {flagged && zone && (() => {
                        // Position further out along the same spoke direction as the label
                        // itself (not a fixed screen-space offset) — otherwise "down" on screen
                        // means "toward center" for axes in the upper half (e.g. C), which made
                        // the icon land on top of that axis' outer beam dot instead of past the label.
                        const iconR = lr + 18
                        const iconX = CENTER + iconR * Math.cos(azimuthRad)
                        const iconY = CENTER - iconR * Math.sin(azimuthRad)
                        return (
                          <text
                            x={iconX}
                            y={iconY}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={severitySvgColor(zone.severity)}
                            fontSize="14"
                            aria-label={`Возможное налипание, ось ${axis}: ${severityLabel(zone.severity)}`}
                          >
                            {severityIcon(zone.severity)}
                          </text>
                        )
                      })()}
                    </g>
                  )
                })()}
              </g>
            )
          })}

          {/* Sidewall buildup indicator — outer-zone arc per axis, drawn behind beam dots so it
              reads as a background layer, not competing with the height color scale */}
          {BEAM_AXES.map((axis) => {
            const zone = buildupByAxis.get(axis)
            if (!zone || zone.severity === 'none') return null
            const start = beamToSvgCoords(axis, OUTER_ZONE_POSITION_THRESHOLD, geometry)
            const end = beamToSvgCoords(axis, 8, geometry)
            return (
              <line
                key={`buildup-${axis}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={severitySvgColor(zone.severity)}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.4}
                aria-hidden="true"
              />
            )
          })}

          {/* Beam dots */}
          {BEAM_AXES.map((axis) =>
            BEAM_POSITIONS.map((pos) => {
              const beamName = `${axis}${pos}`
              const beam = beamMap.get(beamName)
              if (showAllExceptDisabled && beam && isBeamDisabled(beam)) return null

              const { x, y } = beamToSvgCoords(axis, pos, geometry)
              const isSelected = selectedBeam === beamName
              const isHovered = hoveredBeam === beamName
              const isOuter = pos >= 6
              let fillColor: string
              if (!beam) {
                fillColor = 'hsl(220, 10%, 25%)'
              } else if (!hasDisplayHeight(beam, showAllExceptDisabled)) {
                fillColor = 'hsl(220, 10%, 30%)'
              } else {
                const norm =
                  heightRange.max === heightRange.min
                    ? 0.5
                    : (beam.height - heightRange.min) / (heightRange.max - heightRange.min)
                fillColor = heightToColor(norm)
              }

              const radius = isSelected || isHovered ? 10 : 8

              return (
                <g key={beamName}>
                  {/* Hatching for unreliable beams — visible pattern independent of color */}
                  {beam && !beam.reliable && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="none"
                      stroke="hsl(220, 20%, 40%)"
                      strokeWidth="6"
                      strokeDasharray="2 2"
                      opacity={0.7}
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={fillColor}
                    stroke={isSelected ? '#60a5fa' : isOuter ? '#334155' : 'none'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={
                      beam && !beam.reliable && !hasDisplayHeight(beam, showAllExceptDisabled)
                        ? 0.45
                        : 1
                    }
                    className="cursor-pointer transition-all duration-100"
                    onMouseMove={(e) => handleMouseMove(e, beamName)}
                    onMouseLeave={() => setHoveredBeam(null)}
                    onClick={() => onSelectBeam(isSelected ? null : beamName)}
                    aria-label={`${beamName}: ${
                      beam && hasDisplayHeight(beam, showAllExceptDisabled)
                        ? formatLevel(beam.height)
                        : 'нет данных'
                    }`}
                  />

                  {/* Height label (only for hovered or selected) */}
                  {(isHovered || isSelected) &&
                    beam &&
                    hasDisplayHeight(beam, showAllExceptDisabled) && (
                    <text
                      x={x}
                      y={y - radius - 4}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {beam.height.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            }),
          )}

          {/* Center marker */}
          <circle cx={CENTER} cy={CENTER} r={4} fill="#334155" />
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredBeamData && tooltipPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 10,
            zIndex: 50,
          }}
        >
          <BeamTooltip
            beam={hoveredBeamData}
            showHeight={showAllExceptDisabled && !isBeamDisabled(hoveredBeamData)}
          />
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 shrink-0">
        <HeightLegend min={heightRange.min} max={heightRange.max} />
      </div>
    </div>
  )
}
