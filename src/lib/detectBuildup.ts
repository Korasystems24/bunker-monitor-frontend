import type { Beam, BuildupZone } from '../types'
import { BEAM_AXES, OUTER_ZONE_POSITION_THRESHOLD } from '../config'
import { isBeamDisabled, parseBeam } from './parseMeasurement'

// Same bands as the backend RadialSlopeDeviationDetector (radial-slope-v1).
// The deviation threshold itself still comes from GET /buildup (`threshold_m`).
const MEDIUM_FACTOR = 1.5
const HIGH_FACTOR = 2.5
const SCORE_SPAN = 3

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function linearFit(points: Array<{ position: number; height: number }>): {
  slope: number
  intercept: number
} {
  const n = points.length
  const sumX = points.reduce((sum, point) => sum + point.position, 0)
  const sumY = points.reduce((sum, point) => sum + point.height, 0)
  const sumXY = points.reduce((sum, point) => sum + point.position * point.height, 0)
  const sumXX = points.reduce((sum, point) => sum + point.position * point.position, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }
  const slope = (n * sumXY - sumX * sumY) / denom
  return { slope, intercept: (sumY - slope * sumX) / n }
}

function severityFor(maxDeviation: number, thresholdM: number): BuildupZone['severity'] {
  if (maxDeviation > thresholdM * HIGH_FACTOR) return 'high'
  if (maxDeviation > thresholdM * MEDIUM_FACTOR) return 'medium'
  if (maxDeviation > thresholdM) return 'low'
  return 'none'
}

/**
 * Sidewall-buildup zones for the "all beams except Disabled" view.
 * Same slope check as the backend, but NotUsed / Unknown / DistanceNotUpdating
 * heights are kept. Disabled beams are left out.
 */
export function detectBuildupExceptDisabled(beams: Beam[], thresholdM: number): BuildupZone[] {
  const byAxis = new Map<string, Map<number, number>>()
  for (const axis of BEAM_AXES) byAxis.set(axis, new Map())

  for (const beam of beams.map(parseBeam)) {
    if (isBeamDisabled(beam) || beam.height == null || !Number.isFinite(beam.height)) continue
    const parsedName = beam.parsedName
    if (!parsedName) continue
    byAxis.get(parsedName.axis)?.set(parsedName.position, beam.height)
  }

  return BEAM_AXES.map((axis) => {
    const points = [...(byAxis.get(axis)?.entries() ?? [])].map(([position, height]) => ({
      position,
      height,
    }))
    const inner = points.filter((point) => point.position < OUTER_ZONE_POSITION_THRESHOLD)
    const outer = points
      .filter((point) => point.position >= OUTER_ZONE_POSITION_THRESHOLD)
      .sort((a, b) => a.position - b.position)

    if (inner.length < 2 || outer.length === 0) {
      return { axis, severity: 'none', score: 0, deviation_m: 0, affected_positions: [] }
    }

    const { slope, intercept } = linearFit(inner)
    const affected: number[] = []
    let maxDeviation = 0
    for (const point of outer) {
      const deviation = point.height - (intercept + slope * point.position)
      if (deviation > thresholdM) affected.push(point.position)
      if (deviation > maxDeviation) maxDeviation = deviation
    }

    const score =
      thresholdM > 0 ? Math.max(0, Math.min(1, maxDeviation / (thresholdM * SCORE_SPAN))) : 0

    return {
      axis,
      severity: severityFor(maxDeviation, thresholdM),
      score: roundTo(score, 3),
      deviation_m: roundTo(maxDeviation, 4),
      affected_positions: affected,
    }
  })
}
