import type { BunkerGeometry } from '../types'
import { BEAM_AXES, FALLBACK_GEOMETRY } from '../config'

export interface BeamXY {
  x: number
  y: number
}

/**
 * Resolve horizontal (x, y) position of a beam point, in the same unit as /geometry (metres).
 * Uses real coordinates from /geometry when available; falls back to a uniform radial
 * layout (dev only, see FALLBACK_GEOMETRY) scaled to fallbackMaxRadius.
 */
export function resolveBeamXY(
  axis: string,
  position: number,
  geometry: BunkerGeometry | undefined,
  fallbackMaxRadius: number,
): BeamXY {
  const pt = geometry?.beams.find((b) => b.axis === axis && b.position === position)
  if (pt) return { x: pt.x, y: pt.y }

  const axisIdx = BEAM_AXES.indexOf(axis as (typeof BEAM_AXES)[number])
  const azimuthRad = (FALLBACK_GEOMETRY.azimuthStep_deg * axisIdx * Math.PI) / 180
  const r = fallbackMaxRadius * (FALLBACK_GEOMETRY.radiusFractions[position - 1] ?? 0.5)
  return { x: r * Math.cos(azimuthRad), y: r * Math.sin(azimuthRad) }
}

/**
 * Largest radial distance among a geometry's beam points, used to normalise
 * real-world coordinates into another coordinate space (e.g. SVG pixels).
 */
export function maxBeamRadius(geometry: BunkerGeometry | undefined): number {
  if (!geometry || geometry.beams.length === 0) return 0
  return Math.max(...geometry.beams.map((b) => Math.sqrt(b.x * b.x + b.y * b.y)), 0.001)
}
