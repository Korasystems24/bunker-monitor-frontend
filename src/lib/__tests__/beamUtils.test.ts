import { describe, it, expect } from 'vitest'
import { parseStatus, isBeamReliable, parseBeamName, formatBeamName } from '../beamUtils'

// ─── parseStatus ─────────────────────────────────────────────────────────────

describe('parseStatus', () => {
  it('returns empty array for empty string', () => {
    expect(parseStatus('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseStatus('   ')).toEqual([])
  })

  it('parses a single flag', () => {
    expect(parseStatus('Disabled')).toEqual(['Disabled'])
  })

  it('parses multiple flags separated by commas', () => {
    expect(parseStatus('TooShort, NotUsed, WeakSignal')).toEqual([
      'TooShort',
      'NotUsed',
      'WeakSignal',
    ])
  })

  it('trims whitespace around each flag', () => {
    expect(parseStatus('  WeakSignal  ,  TooLong  ')).toEqual(['WeakSignal', 'TooLong'])
  })

  it('handles unknown flags without throwing', () => {
    expect(parseStatus('FutureFlag, AnotherUnknown')).toEqual([
      'FutureFlag',
      'AnotherUnknown',
    ])
  })

  it('preserves exact flag spelling', () => {
    const result = parseStatus('OutOfReposeAngle, DistanceNotUpdating')
    expect(result).toEqual(['OutOfReposeAngle', 'DistanceNotUpdating'])
  })
})

// ─── isBeamReliable ───────────────────────────────────────────────────────────

describe('isBeamReliable', () => {
  it('returns true for empty flags (fully reliable beam)', () => {
    expect(isBeamReliable([])).toBe(true)
  })

  it('returns false when Disabled is present', () => {
    expect(isBeamReliable(['Disabled'])).toBe(false)
  })

  it('returns false when DistanceNotUpdating is present', () => {
    expect(isBeamReliable(['DistanceNotUpdating'])).toBe(false)
  })

  it('returns false when NotUsed is present', () => {
    expect(isBeamReliable(['NotUsed'])).toBe(false)
  })

  it('returns false when Unknown is present', () => {
    expect(isBeamReliable(['Unknown'])).toBe(false)
  })

  it('returns false when unreliable flag is mixed with others', () => {
    expect(isBeamReliable(['WeakSignal', 'Disabled', 'TooShort'])).toBe(false)
  })

  it('returns true for degraded-but-reliable flags (WeakSignal, TooShort, TooLong, OutOfReposeAngle)', () => {
    expect(isBeamReliable(['WeakSignal'])).toBe(true)
    expect(isBeamReliable(['TooShort'])).toBe(true)
    expect(isBeamReliable(['TooLong'])).toBe(true)
    expect(isBeamReliable(['OutOfReposeAngle'])).toBe(true)
  })

  it('returns true for unknown future flags (open-ended list)', () => {
    expect(isBeamReliable(['SomeFutureFlag'])).toBe(true)
  })
})

// ─── parseBeamName ────────────────────────────────────────────────────────────

describe('parseBeamName', () => {
  it('parses axis A position 1', () => {
    expect(parseBeamName('A1')).toEqual({ axis: 'A', position: 1 })
  })

  it('parses axis H position 8 (outer wall)', () => {
    expect(parseBeamName('H8')).toEqual({ axis: 'H', position: 8 })
  })

  it('parses all valid axes A–H', () => {
    for (const axis of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      expect(parseBeamName(`${axis}4`)).toEqual({ axis, position: 4 })
    }
  })

  it('parses all valid positions 1–8', () => {
    for (let pos = 1; pos <= 8; pos++) {
      expect(parseBeamName(`A${pos}`)).toEqual({ axis: 'A', position: pos })
    }
  })

  it('returns null for lowercase axis', () => {
    expect(parseBeamName('a1')).toBeNull()
  })

  it('returns null for position out of range', () => {
    expect(parseBeamName('A0')).toBeNull()
    expect(parseBeamName('A9')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseBeamName('')).toBeNull()
  })

  it('returns null for axis only', () => {
    expect(parseBeamName('A')).toBeNull()
  })

  it('returns null for extra characters', () => {
    expect(parseBeamName('A12')).toBeNull()
    expect(parseBeamName('AA1')).toBeNull()
  })
})

// ─── formatBeamName ───────────────────────────────────────────────────────────

describe('formatBeamName', () => {
  it('formats axis and position back to beam name', () => {
    expect(formatBeamName('A', 1)).toBe('A1')
    expect(formatBeamName('H', 8)).toBe('H8')
  })

  it('is inverse of parseBeamName for valid inputs', () => {
    const beams = ['A1', 'C4', 'H8']
    for (const name of beams) {
      const parsed = parseBeamName(name)
      expect(parsed).not.toBeNull()
      if (parsed) {
        expect(formatBeamName(parsed.axis, parsed.position)).toBe(name)
      }
    }
  })
})
