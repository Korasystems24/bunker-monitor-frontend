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
export function summarizeBeamHealth(beams: Beam[]): BeamHealthSummary {
  const parsed = beams.map(parseBeam)
  const valid = parsed.filter((b) => b.reliable).length
  const degraded = parsed.filter((b) => !b.reliable && !b.statusFlags.includes('Disabled')).length
  const disabled = parsed.filter((b) => b.statusFlags.includes('Disabled')).length
  const outerValid = parsed.filter(
    (b) => b.reliable && b.parsedName && b.parsedName.position >= OUTER_ZONE_POSITION_THRESHOLD,
  ).length
  const outerTotal = parsed.filter(
    (b) => b.parsedName && b.parsedName.position >= OUTER_ZONE_POSITION_THRESHOLD,
  ).length
  return { total: parsed.length, valid, degraded, disabled, outerValid, outerTotal }
}
