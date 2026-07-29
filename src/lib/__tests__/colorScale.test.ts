import { describe, it, expect } from 'vitest'
import { heightToColor, computeHeightRange } from '../colorScale'

// ─── heightToColor ────────────────────────────────────────────────────────────

describe('heightToColor', () => {
  it('returns gray for null (unreliable beam)', () => {
    expect(heightToColor(null)).toBe('hsl(220, 10%, 35%)')
  })

  it('returns blue-range color for normalised = 0 (lowest)', () => {
    const color = heightToColor(0)
    expect(color).toMatch(/^hsl\(220,/)
  })

  it('returns red-range color for normalised = 1 (highest)', () => {
    const color = heightToColor(1)
    expect(color).toMatch(/^hsl\(0,/)
  })

  it('returns a valid hsl string for mid-range values', () => {
    const hslPattern = /^hsl\(\d+, \d+%, \d+%\)$/
    expect(heightToColor(0.25)).toMatch(hslPattern)
    expect(heightToColor(0.5)).toMatch(hslPattern)
    expect(heightToColor(0.75)).toMatch(hslPattern)
  })

  it('clamps values below 0 to 0', () => {
    expect(heightToColor(-0.5)).toBe(heightToColor(0))
  })

  it('clamps values above 1 to 1', () => {
    expect(heightToColor(1.5)).toBe(heightToColor(1))
  })

  it('produces different colors for different normalised values', () => {
    const low = heightToColor(0.1)
    const high = heightToColor(0.9)
    expect(low).not.toBe(high)
  })
})

// ─── computeHeightRange ───────────────────────────────────────────────────────

describe('computeHeightRange', () => {
  it('returns default range for empty array', () => {
    expect(computeHeightRange([])).toEqual({ min: 0, max: 1 })
  })

  it('returns correct min and max for normal input', () => {
    expect(computeHeightRange([1.0, 2.5, 3.0, 1.8])).toEqual({ min: 1.0, max: 3.0 })
  })

  it('returns single-element range with padding (avoids division by zero)', () => {
    const { min, max } = computeHeightRange([2.5])
    expect(min).toBeLessThan(2.5)
    expect(max).toBeGreaterThan(2.5)
    expect(max - min).toBeGreaterThan(0)
  })

  it('returns padded range when all values are equal', () => {
    const { min, max } = computeHeightRange([3.0, 3.0, 3.0])
    expect(min).toBeLessThan(3.0)
    expect(max).toBeGreaterThan(3.0)
  })

  it('handles negative heights gracefully', () => {
    const { min, max } = computeHeightRange([-1.0, 0.5, 2.0])
    expect(min).toBe(-1.0)
    expect(max).toBe(2.0)
  })
})
