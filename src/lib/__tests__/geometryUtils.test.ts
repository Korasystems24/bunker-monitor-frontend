import { describe, it, expect } from 'vitest'
import { resolveBeamXY, maxBeamRadius } from '../geometryUtils'
import type { BunkerGeometry } from '../../types'

const makeGeometry = (beams: BunkerGeometry['beams']): BunkerGeometry => ({
  bunker_id: 'bunker-1',
  shape: { type: 'truncated_cone', top_diameter_m: 7, bottom_diameter_m: 4.2, height_m: 8 },
  sensor: { x: 0, y: 0, z: 8.5, tilt_deg: 0 },
  beams,
})

describe('resolveBeamXY', () => {
  it('uses the real coordinates from geometry when a matching point exists', () => {
    const geometry = makeGeometry([
      { beam_name: 'A1', axis: 'A', position: 1, x: 0.35, y: 0, z: 0 },
    ])
    expect(resolveBeamXY('A', 1, geometry, 3.5)).toEqual({ x: 0.35, y: 0 })
  })

  it('falls back to the uniform radial layout when the beam is missing from geometry', () => {
    const geometry = makeGeometry([])
    const { x, y } = resolveBeamXY('A', 1, geometry, 3.5)
    // axis A is index 0 → azimuth 0° → y should be ~0, x should be positive
    expect(x).toBeGreaterThan(0)
    expect(y).toBeCloseTo(0, 5)
  })

  it('falls back to the uniform radial layout when geometry is undefined', () => {
    const { x, y } = resolveBeamXY('C', 8, undefined, 3.5)
    // axis C is index 2 → azimuth 90° → x should be ~0, y should be positive (outermost position)
    expect(x).toBeCloseTo(0, 5)
    expect(y).toBeCloseTo(3.5 * 0.95, 5)
  })
})

describe('maxBeamRadius', () => {
  it('returns 0 for undefined geometry', () => {
    expect(maxBeamRadius(undefined)).toBe(0)
  })

  it('returns 0 for geometry with no beams', () => {
    expect(maxBeamRadius(makeGeometry([]))).toBe(0)
  })

  it('returns the largest radial distance among beam points', () => {
    const geometry = makeGeometry([
      { beam_name: 'A1', axis: 'A', position: 1, x: 1, y: 0, z: 0 },
      { beam_name: 'A8', axis: 'A', position: 8, x: 3, y: 4, z: 0 }, // distance 5
    ])
    expect(maxBeamRadius(geometry)).toBe(5)
  })
})
