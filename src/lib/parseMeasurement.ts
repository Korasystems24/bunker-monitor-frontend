import type { Beam, Measurement, ParsedBeam } from '../types'
import { parseStatus, isBeamReliable, parseBeamName } from './beamUtils'
import { OUTER_ZONE_POSITION_THRESHOLD } from '../config'

/**
 * Enrich raw Beam from API with parsed status flags, reliability flag, and parsed name.
 */
export function parseBeam(beam: Beam): ParsedBeam {
  const statusFlags = parseStatus(beam.status)
  const reliable = beam.height !== null && isBeamReliable(statusFlags)
  const parsedName = parseBeamName(beam.beam_name)
  return { ...beam, statusFlags, reliable, parsedName }
}

export function hasUsableHeight(
  beam: ParsedBeam,
): beam is ParsedBeam & { height: number; reliable: true } {
  return beam.reliable && beam.height !== null && beam.height > 0
}

export function isBeamDisabled(beam: ParsedBeam): boolean {
  return beam.statusFlags.includes('Disabled')
}

/**
 * Height to paint on the beam map, table, and 3D scene.
 * By default only a reliable positive height counts.
 * With `showAllExceptDisabled`, every positive height from the backend is shown
 * except beams flagged Disabled (those stay empty — height 0 is not ore level).
 */
export function hasDisplayHeight(
  beam: ParsedBeam,
  showAllExceptDisabled: boolean,
): beam is ParsedBeam & { height: number } {
  if (beam.height == null || !(beam.height > 0)) return false
  if (showAllExceptDisabled) return !isBeamDisabled(beam)
  return beam.reliable
}

/**
 * Enrich a full Measurement with parsed beams.
 */
export function parseMeasurement(m: Measurement): Measurement & { parsedBeams: ParsedBeam[] } {
  return { ...m, parsedBeams: m.beams.map(parseBeam) }
}

export interface BeamHealthSummary {
  total: number
  valid: number
  degraded: number
  disabled: number
  outerValid: number
  outerTotal: number
}

/**
 * Aggregate beam reliability counts for a measurement — shared by the dashboard's health bar
 * and the multi-bunker overview cards, so the two don't drift on what counts as "degraded".
 */
export function summarizeBeamHealth(
  beams: Beam[],
  options?: { showAllExceptDisabled?: boolean },
): BeamHealthSummary {
  const showAllExceptDisabled = options?.showAllExceptDisabled ?? false
  const parsed = beams.map(parseBeam)
  const valid = parsed.filter((b) => b.reliable).length
  const degraded = parsed.filter((b) => !b.reliable && !b.statusFlags.includes('Disabled')).length
  const disabled = parsed.filter((b) => b.statusFlags.includes('Disabled')).length
  const outerValid = parsed.filter((b) => {
    if (!b.parsedName || b.parsedName.position < OUTER_ZONE_POSITION_THRESHOLD) return false
    if (showAllExceptDisabled) return hasDisplayHeight(b, true)
    return b.reliable
  }).length
  const outerTotal = parsed.filter(
    (b) => b.parsedName && b.parsedName.position >= OUTER_ZONE_POSITION_THRESHOLD,
  ).length
  return { total: parsed.length, valid, degraded, disabled, outerValid, outerTotal }
}
