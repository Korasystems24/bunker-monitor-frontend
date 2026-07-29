import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPeriodRange } from '../dateUtils'

describe('getPeriodRange', () => {
  const FIXED_NOW = new Date('2026-06-22T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('"to" is always approximately now', () => {
    const { to } = getPeriodRange('day')
    expect(new Date(to).getTime()).toBeCloseTo(FIXED_NOW.getTime(), -3)
  })

  it('day: "from" is 24 hours before now', () => {
    const { from, to } = getPeriodRange('day')
    const diffMs = new Date(to).getTime() - new Date(from).getTime()
    expect(diffMs).toBe(24 * 60 * 60 * 1000)
  })

  it('week: "from" is 7 days before now', () => {
    const { from, to } = getPeriodRange('week')
    const diffMs = new Date(to).getTime() - new Date(from).getTime()
    expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('month: "from" is 1 calendar month before now', () => {
    const { from } = getPeriodRange('month')
    expect(new Date(from).getFullYear()).toBe(2026)
    expect(new Date(from).getMonth()).toBe(4) // May = 4 (0-indexed)
    expect(new Date(from).getDate()).toBe(22)
  })

  it('returns ISO-8601 strings', () => {
    const { from, to } = getPeriodRange('day')
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('"from" is always before "to"', () => {
    for (const period of ['day', 'week', 'month'] as const) {
      const { from, to } = getPeriodRange(period)
      expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime())
    }
  })
})
