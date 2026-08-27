import type { ParsedBeam } from '../types'
import { BEAM_AXES, BEAM_POSITIONS } from '../config'
import { hasUsableHeight } from './parseMeasurement'

export interface SurfaceGridCell {
  axis: string
  position: number
  height: number
  // true when the original beam reading was missing/unreliable and this value was filled in
  interpolated: boolean
}

/**
 * Build an 8×8 (axis × position) grid of surface heights for the ore heatmap.
 *
 * Unreliable/missing beam readings must not "pull" the surface toward a false
 * value (height=0 does not mean "no ore" — see isBeamReliable). Instead each
 * empty cell is filled from its 4-connected neighbours — the previous/next axis
 * at the same position (angular) and position-1/position+1 on the same axis
 * (radial) — averaging whichever of those are already known. Several relaxation
 * passes let filled values propagate outward from known cells until the whole
 * grid is covered (axes wrap around, so a full ring is reachable). Cells that
 * remain empty after all passes (e.g. an entire axis disabled) fall back to the
 * average of all reliable heights in the measurement.
 */
export function buildSurfaceGrid(beams: ParsedBeam[]): SurfaceGridCell[][] {
  const beamMap = new Map<string, ParsedBeam>()
  beams.forEach((b) => beamMap.set(b.beam_name, b))

  const nAxes = BEAM_AXES.length
  const nPos = BEAM_POSITIONS.length

  let heights: number[][] = BEAM_AXES.map((axis) =>
    BEAM_POSITIONS.map((position) => {
      const beam = beamMap.get(`${axis}${position}`)
      return beam && hasUsableHeight(beam) ? beam.height : 0
    }),
  )
  let known: boolean[][] = BEAM_AXES.map((axis) =>
    BEAM_POSITIONS.map((position) => {
      const beam = beamMap.get(`${axis}${position}`)
      return Boolean(beam && hasUsableHeight(beam))
    }),
  )
  const initiallyKnown = known.map((row) => [...row])

  const reliableHeights = heights.flatMap((row, a) => row.filter((_, p) => known[a][p]))
  const globalFallback =
    reliableHeights.length > 0
      ? reliableHeights.reduce((sum, v) => sum + v, 0) / reliableHeights.length
      : 0

  // Relaxation passes: nAxes passes are enough for a fill to travel all the way around the ring
  for (let pass = 0; pass < nAxes; pass++) {
    let filledAny = false
    const nextHeights = heights.map((row) => [...row])
    const nextKnown = known.map((row) => [...row])

    for (let a = 0; a < nAxes; a++) {
      for (let p = 0; p < nPos; p++) {
        if (known[a][p]) continue

        const prevAxis = (a - 1 + nAxes) % nAxes
        const nextAxis = (a + 1) % nAxes
        const candidates: number[] = []
        if (known[prevAxis][p]) candidates.push(heights[prevAxis][p])
        if (known[nextAxis][p]) candidates.push(heights[nextAxis][p])
        if (p > 0 && known[a][p - 1]) candidates.push(heights[a][p - 1])
        if (p < nPos - 1 && known[a][p + 1]) candidates.push(heights[a][p + 1])

        if (candidates.length > 0) {
          nextHeights[a][p] = candidates.reduce((sum, v) => sum + v, 0) / candidates.length
          nextKnown[a][p] = true
          filledAny = true
        }
      }
    }

    heights = nextHeights
    known = nextKnown
    if (!filledAny) break
  }

  return BEAM_AXES.map((axis, a) =>
    BEAM_POSITIONS.map((position, p) => ({
      axis,
      position,
      height: known[a][p] ? heights[a][p] : globalFallback,
      interpolated: !initiallyKnown[a][p],
    })),
  )
}

/**
 * Height at the bunker centre (position 0), used as the innermost vertex of the
 * ore surface mesh. Approximated as the average height of position-1 cells
 * (closest to centre) across all axes.
 */
export function computeCenterHeight(grid: SurfaceGridCell[][]): number {
  const innerHeights = grid.map((row) => row[0].height)
  if (innerHeights.length === 0) return 0
  return innerHeights.reduce((sum, v) => sum + v, 0) / innerHeights.length
}
