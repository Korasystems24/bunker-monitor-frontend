import type { BeamStatusFlag, KnownBeamStatusFlag } from '../types'

// Flags that indicate measurement cannot be trusted
const UNRELIABLE_FLAGS = new Set<KnownBeamStatusFlag>([
  'Disabled',
  'DistanceNotUpdating',
  'NotUsed',
  'Unknown',
])

/**
 * Parse comma-separated status string into an array of trimmed flags.
 * Handles unknown flags gracefully (open-ended flag list per spec).
 */
export function parseStatus(statusStr: string): BeamStatusFlag[] {
  if (!statusStr.trim()) return []
  return statusStr.split(',').map((s) => s.trim())
}

/**
 * Determine if a beam's measurement can be trusted.
 * height=0 with unreliable flags means "no valid measurement", not "no ore".
 */
export function isBeamReliable(statusFlags: BeamStatusFlag[]): boolean {
  return !statusFlags.some((flag) => UNRELIABLE_FLAGS.has(flag as KnownBeamStatusFlag))
}

/**
 * Parse beam_name like "H6" → { axis: "H", position: 6 }
 * Returns null if format is unexpected.
 */
export function parseBeamName(beamName: string): { axis: string; position: number } | null {
  const match = /^([A-H])([1-8])$/.exec(beamName)
  if (!match) return null
  // match[1] and match[2] are guaranteed by the regex groups
  return { axis: match[1] ?? '', position: parseInt(match[2] ?? '0', 10) }
}

/**
 * Reverse of parseBeamName
 */
export function formatBeamName(axis: string, position: number): string {
  return `${axis}${position}`
}
