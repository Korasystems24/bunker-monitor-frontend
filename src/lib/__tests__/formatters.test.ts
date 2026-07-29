import { describe, it, expect } from 'vitest'
import { formatLevel, formatVolume, formatMass, formatTimestamp } from '../formatters'

describe('formatLevel', () => {
  it('formats a number with 2 decimal places and unit', () => {
    expect(formatLevel(3.14159)).toBe('3.14 м')
  })

  it('respects custom decimal count', () => {
    expect(formatLevel(3.14159, 3)).toBe('3.142 м')
  })

  it('returns — for null', () => {
    expect(formatLevel(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatLevel(undefined)).toBe('—')
  })

  it('returns — for non-finite value', () => {
    expect(formatLevel(Infinity)).toBe('—')
    expect(formatLevel(NaN)).toBe('—')
  })

  it('formats zero correctly', () => {
    expect(formatLevel(0)).toBe('0.00 м')
  })
})

describe('formatVolume', () => {
  it('formats with unit м³', () => {
    expect(formatVolume(12.5)).toBe('12.50 м³')
  })

  it('returns — for null', () => {
    expect(formatVolume(null)).toBe('—')
  })
})

describe('formatMass', () => {
  it('formats with 3 decimal places and unit т', () => {
    expect(formatMass(39.123)).toBe('39.123 т')
  })

  it('returns — for null', () => {
    expect(formatMass(null)).toBe('—')
  })
})

describe('formatTimestamp', () => {
  it('returns — for null', () => {
    expect(formatTimestamp(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('—')
  })

  it('returns a non-empty string for a valid ISO timestamp', () => {
    const result = formatTimestamp('2026-06-22T10:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('—')
  })

  it('includes the year 2026 in the formatted output', () => {
    const result = formatTimestamp('2026-06-22T10:00:00.000Z')
    expect(result).toContain('2026')
  })
})
