import { describe, it, expect } from 'vitest'
import type { BuildupZone } from '../../types'
import {
  severityRank,
  sortZonesBySeverity,
  severityLabel,
  severityIcon,
  severityColorClasses,
  severitySvgColor,
} from '../buildupUtils'

function zone(axis: string, severity: string, score = 0): BuildupZone {
  return { axis, severity, score, deviation_m: 0, affected_positions: [] }
}

// ─── severityRank ─────────────────────────────────────────────────────────────

describe('severityRank', () => {
  it('ranks known severities in ascending order of concern', () => {
    expect(severityRank('none')).toBeLessThan(severityRank('low'))
    expect(severityRank('low')).toBeLessThan(severityRank('medium'))
    expect(severityRank('medium')).toBeLessThan(severityRank('high'))
  })

  it('ranks unknown severities above "high" (fail-safe, not silently buried)', () => {
    expect(severityRank('critical-future-flag')).toBeGreaterThan(severityRank('high'))
  })
})

// ─── sortZonesBySeverity ──────────────────────────────────────────────────────

describe('sortZonesBySeverity', () => {
  it('sorts zones by severity descending', () => {
    const zones = [zone('A', 'none'), zone('B', 'high'), zone('C', 'low'), zone('D', 'medium')]
    const sorted = sortZonesBySeverity(zones)
    expect(sorted.map((z) => z.axis)).toEqual(['B', 'D', 'C', 'A'])
  })

  it('breaks ties within the same severity by score descending', () => {
    const zones = [zone('A', 'high', 0.3), zone('B', 'high', 0.9)]
    const sorted = sortZonesBySeverity(zones)
    expect(sorted.map((z) => z.axis)).toEqual(['B', 'A'])
  })

  it('does not mutate the input array', () => {
    const zones = [zone('A', 'none'), zone('B', 'high')]
    const original = [...zones]
    sortZonesBySeverity(zones)
    expect(zones).toEqual(original)
  })
})

// ─── severityLabel / severityIcon / colors ────────────────────────────────────

describe('severityLabel', () => {
  it('returns Russian labels for known severities', () => {
    expect(severityLabel('none')).toBe('Нет')
    expect(severityLabel('high')).toBe('Высокая')
  })

  it('falls back gracefully for unknown severities', () => {
    expect(severityLabel('mystery')).toContain('mystery')
  })
})

describe('severityIcon', () => {
  it('returns a distinct glyph per known severity (not color-only)', () => {
    const icons = new Set(['none', 'low', 'medium', 'high'].map(severityIcon))
    expect(icons.size).toBe(4)
  })

  it('returns a fallback glyph for unknown severities', () => {
    expect(severityIcon('mystery')).toBe('?')
  })
})

describe('severityColorClasses / severitySvgColor', () => {
  it('returns distinct classes for each known severity', () => {
    const classes = new Set(['none', 'low', 'medium', 'high'].map(severityColorClasses))
    expect(classes.size).toBe(4)
  })

  it('returns a distinguishable fallback color for unknown severities', () => {
    expect(severitySvgColor('mystery')).not.toBe(severitySvgColor('high'))
  })
})
