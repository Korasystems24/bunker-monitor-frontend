import { describe, it, expect } from 'vitest'
import { hasUsableHeight, parseBeam, parseMeasurement } from '../parseMeasurement'
import type { Beam, Measurement } from '../../types'

const makeBeam = (overrides: Partial<Beam> = {}): Beam => ({
  beam_name: 'A1',
  height: 3.2,
  status: '',
  ...overrides,
})

const makeMeasurement = (beams: Beam[] = []): Measurement => ({
  id: 1,
  ts: '2026-06-22T10:00:00.000Z',
  avg_level: 3.2,
  min_level: 2.1,
  max_level: 4.0,
  mass: 39.5,
  volume: 17.2,
  beams,
})

// ─── parseBeam ────────────────────────────────────────────────────────────────

describe('parseBeam', () => {
  it('sets reliable=true for beam with empty status', () => {
    const beam = makeBeam({ status: '' })
    expect(parseBeam(beam).reliable).toBe(true)
  })

  it('sets reliable=false for beam with Disabled flag', () => {
    const beam = makeBeam({ status: 'Disabled' })
    expect(parseBeam(beam).reliable).toBe(false)
  })

  it('sets reliable=false for beam with NotUsed flag', () => {
    const beam = makeBeam({ status: 'TooShort, NotUsed' })
    expect(parseBeam(beam).reliable).toBe(false)
  })

  it('sets reliable=false for a nullable height even without status flags', () => {
    const beam = makeBeam({ height: null, status: '' })
    expect(parseBeam(beam).reliable).toBe(false)
  })

  it('sets reliable=true for degraded-but-trustworthy flags', () => {
    const beam = makeBeam({ status: 'WeakSignal, TooLong' })
    expect(parseBeam(beam).reliable).toBe(true)
  })

  it('parses statusFlags as array', () => {
    const beam = makeBeam({ status: 'TooShort, WeakSignal' })
    expect(parseBeam(beam).statusFlags).toEqual(['TooShort', 'WeakSignal'])
  })

  it('sets parsedName correctly for valid beam_name', () => {
    const beam = makeBeam({ beam_name: 'H6' })
    expect(parseBeam(beam).parsedName).toEqual({ axis: 'H', position: 6 })
  })

  it('sets parsedName to null for invalid beam_name', () => {
    const beam = makeBeam({ beam_name: 'INVALID' })
    expect(parseBeam(beam).parsedName).toBeNull()
  })

  it('preserves original beam fields', () => {
    const beam = makeBeam({ beam_name: 'C3', height: 2.5, status: 'WeakSignal' })
    const parsed = parseBeam(beam)
    expect(parsed.beam_name).toBe('C3')
    expect(parsed.height).toBe(2.5)
    expect(parsed.status).toBe('WeakSignal')
  })
})

// ─── parseMeasurement ─────────────────────────────────────────────────────────

describe('parseMeasurement', () => {
  it('adds parsedBeams array with same length as beams', () => {
    const beams = [makeBeam({ beam_name: 'A1' }), makeBeam({ beam_name: 'B2' })]
    const result = parseMeasurement(makeMeasurement(beams))
    expect(result.parsedBeams).toHaveLength(2)
  })

  it('preserves original measurement fields', () => {
    const m = makeMeasurement([])
    const result = parseMeasurement(m)
    expect(result.id).toBe(1)
    expect(result.avg_level).toBe(3.2)
    expect(result.ts).toBe('2026-06-22T10:00:00.000Z')
  })

  it('each parsedBeam has reliable and statusFlags', () => {
    const beams = [
      makeBeam({ status: '' }),
      makeBeam({ status: 'Disabled' }),
    ]
    const { parsedBeams } = parseMeasurement(makeMeasurement(beams))
    expect(parsedBeams[0]?.reliable).toBe(true)
    expect(parsedBeams[1]?.reliable).toBe(false)
  })
})

describe('hasUsableHeight', () => {
  it('rejects height 0 even when status is reliable', () => {
    expect(hasUsableHeight(parseBeam(makeBeam({ height: 0, status: '' })))).toBe(false)
  })

  it('accepts a positive reliable height', () => {
    expect(hasUsableHeight(parseBeam(makeBeam({ height: 1.7, status: '' })))).toBe(true)
  })
})
