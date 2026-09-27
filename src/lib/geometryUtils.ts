import type { BunkerGeometry, BunkerShape, SensorPlacement } from '../types'
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

/**
 * Largest full-width dimension across the tank's three cross-section levels
 * (bottom/middle/top, X and Y independently) — the rectangular-footprint
 * equivalent of the old cone's "diameter", used for camera framing and as a
 * fallback beam-layout radius when /geometry has no matching beam point.
 */
export function maxShapeHorizontalExtent(shape: BunkerShape): number {
  return Math.max(
    shape.top_x_m,
    shape.top_y_m,
    shape.middle_x_m,
    shape.middle_y_m,
    shape.bottom_x_m,
    shape.bottom_y_m,
  )
}

/**
 * Direction of the sensor's boresight (in the bunker's own X/Y/height axes,
 * downward = negative height), reconstructed from `tilt_x_deg`/`tilt_y_deg`.
 *
 * These two angles are dual-axis inclinometer readings from the Configurator
 * (`incl_x`/`incl_y`): each is the angle between the boresight and true
 * vertical *as seen when projected onto that one axis's vertical plane*
 * (X/height or Y/height), independent of the other axis. Given that
 * definition, the boresight vector (dx, dy, dz) with dz = -1 satisfies
 * `dx = tan(tilt_x)` and `dy = tan(tilt_y)` by construction — this is the
 * only reconstruction that reproduces both projection angles exactly.
 *
 * Applying the two angles as two sequential axis rotations instead (e.g. via
 * a three.js Euler `[a, 0, b]`) does NOT work: the second rotation acts on
 * the vector already tilted by the first, so the composition cross-couples
 * the two axes and reproduces neither angle once both are non-trivial — it
 * can even flip the effective sign of one axis's tilt. Always use this
 * function (or the same tangent-based formula) rather than two rotations.
 */
export function sensorBoresightDirection(sensor: Pick<SensorPlacement, 'tilt_x_deg' | 'tilt_y_deg'>): {
  x: number
  y: number
  z: number
} {
  const dx = Math.tan((sensor.tilt_x_deg * Math.PI) / 180)
  const dy = Math.tan((sensor.tilt_y_deg * Math.PI) / 180)
  const dz = -1
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
  return { x: dx / length, y: dy / length, z: dz / length }
}
