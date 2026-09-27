import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ParsedBeam } from '../../types'
import { BEAM_AXES, BEAM_POSITIONS, OUTER_ZONE_POSITION_THRESHOLD } from '../../config'
import { heightToColor, computeHeightRange } from '../../lib/colorScale'
import { formatLevel } from '../../lib/formatters'
import { hasDisplayHeight, isBeamDisabled } from '../../lib/parseMeasurement'
import { BeamTooltip } from './BeamTooltip'

interface BeamTableProps {
  beams: ParsedBeam[]
  selectedBeam: string | null
  onSelectBeam: (name: string | null) => void
  showAllExceptDisabled?: boolean
}

// Generous upper-bound estimates of BeamTooltip's rendered size (fixed w-52 width;
// height varies with the number of status flags) — used only to decide which side
// of the cell has room, so the tooltip never pushes the scroll container's
// scrollable area past its visible bounds (that's what caused the phantom scrollbar).
const TOOLTIP_WIDTH = 208
const TOOLTIP_HEIGHT = 170

export function BeamTable({
  beams,
  selectedBeam,
  onSelectBeam,
  showAllExceptDisabled = false,
}: BeamTableProps) {
  const [hoveredBeam, setHoveredBeam] = useState<string | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null)

  const beamMap = useMemo(() => {
    const map = new Map<string, ParsedBeam>()
    beams.forEach((b) => map.set(b.beam_name, b))
    return map
  }, [beams])

  const heightRange = useMemo(() => {
    const heights = beams
      .filter((beam) => hasDisplayHeight(beam, showAllExceptDisabled))
      .map((b) => b.height)
    return computeHeightRange(heights)
  }, [beams, showAllExceptDisabled])

  const hoveredBeamData = hoveredBeam ? beamMap.get(hoveredBeam) : null

  function cellColor(beam: ParsedBeam | undefined): string {
    if (!beam || !hasDisplayHeight(beam, showAllExceptDisabled)) return 'transparent'
    const norm =
      heightRange.max === heightRange.min
        ? 0.5
        : (beam.height - heightRange.min) / (heightRange.max - heightRange.min)
    return heightToColor(norm)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs font-mono">
        <thead>
          <tr>
            <th className="pb-2 pr-2 w-14 text-left text-slate-500 font-normal">Ось\Поз</th>
            {BEAM_POSITIONS.map((pos) => (
              <th
                key={pos}
                className={`pb-2 text-center font-normal ${
                  pos >= OUTER_ZONE_POSITION_THRESHOLD ? 'text-amber-600' : 'text-slate-500'
                }`}
              >
                {pos}
                {pos >= OUTER_ZONE_POSITION_THRESHOLD && (
                  <span className="text-[8px] block leading-none text-amber-700">бок</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BEAM_AXES.map((axis) => (
            <tr key={axis} className="border-t border-surface-3">
              <td className="py-1 pr-2 w-14 font-bold text-slate-400">{axis}</td>
              {BEAM_POSITIONS.map((pos) => {
                const beamName = `${axis}${pos}`
                const beam = beamMap.get(beamName)
                const isSelected = selectedBeam === beamName
                const hiddenDisabled = Boolean(
                  showAllExceptDisabled && beam && isBeamDisabled(beam),
                )
                const displayHeight =
                  beam && hasDisplayHeight(beam, showAllExceptDisabled) ? beam.height : null
                const bg = cellColor(beam)

                return (
                  <td
                    key={pos}
                    className={`relative py-1 text-center cursor-pointer rounded transition-all ${
                      isSelected ? 'ring-1 ring-blue-400' : ''
                    }`}
                    style={{ backgroundColor: bg }}
                    onMouseEnter={(e) => {
                      setHoveredBeam(beamName)
                      // Positioned in the viewport (position: fixed) and rendered
                      // through a portal — so the tooltip never becomes part of
                      // this table's scrollable content, no matter which cell it's
                      // anchored to.
                      const rect = e.currentTarget.getBoundingClientRect()
                      const flipX = window.innerWidth - rect.right < TOOLTIP_WIDTH
                      const flipY = window.innerHeight - rect.bottom < TOOLTIP_HEIGHT
                      setTooltipStyle({
                        position: 'fixed',
                        left: flipX ? rect.left - 4 : rect.right + 4,
                        top: flipY ? rect.top - 4 : rect.bottom + 4,
                        transform: `translate(${flipX ? '-100%' : '0'}, ${flipY ? '-100%' : '0'})`,
                        zIndex: 50,
                        pointerEvents: 'none',
                      })
                    }}
                    onMouseLeave={() => setHoveredBeam(null)}
                    onClick={() => onSelectBeam(isSelected ? null : beamName)}
                    aria-label={`${beamName}: ${
                      hiddenDisabled || !beam ? 'нет данных' : formatLevel(displayHeight)
                    }`}
                  >
                    {!beam || hiddenDisabled ? (
                      <span className="text-slate-700">—</span>
                    ) : displayHeight == null ? (
                      // Status icon (not just color) — important for colorblind users
                      <span
                        className="inline-flex items-center justify-center text-slate-600 opacity-50"
                        title={beam.statusFlags.join(', ')}
                        aria-label={`Недостоверен: ${beam.statusFlags.join(', ')}`}
                      >
                        ✕
                      </span>
                    ) : (
                      <span
                        className="tabular-nums font-semibold"
                        style={{
                          color: 'rgba(255,255,255,0.85)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {displayHeight.toFixed(2)}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tooltip — portaled to <body> so it never contributes to this table's own overflow */}
      {hoveredBeamData &&
        tooltipStyle &&
        createPortal(
          <div style={tooltipStyle}>
            <BeamTooltip
              beam={hoveredBeamData}
              showHeight={
                showAllExceptDisabled && !isBeamDisabled(hoveredBeamData)
              }
            />
          </div>,
          document.body,
        )}

      {/* Legend note */}
      <p className="mt-2 text-right text-xs text-slate-600">
        ✕ = недостоверный луч &nbsp;·&nbsp;
        <span className="text-amber-700">бок</span> = боковая зона
      </p>
    </div>
  )
}
