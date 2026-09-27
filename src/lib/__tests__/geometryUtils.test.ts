import { describe, it, expect } from 'vitest'
import {
  resolveBeamXY,
  maxBeamRadius,
  maxShapeHorizontalExtent,
  sensorBoresightDirection,
} from '../geometryUtils'
import type { BunkerGeometry, BunkerShape } from '../../types'

const makeShape = (overrides: Partial<BunkerShape> = {}): BunkerShape => ({
  type: 'tiered_rect',
  bottom_x_m: 1.8,
  bottom_y_m: 2.4,
  bottom_height_m: 0,
  middle_x_m: 2.4,
  middle_y_m: 2.4,
  middle_height_m: 1.4,
  top_x_m: 3.2,
  top_y_m: 3.2,
  top_height_m: 2.0,
  vessel_height_m: 3.4,
  full_volume_m3: 23.85,
  rotation_deg: 0,
  ...overrides,
})

const makeGeometry = (beams: BunkerGeometry['beams']): BunkerGeometry => ({
  bunker_id: 'bunker-1',
  shape: makeShape(),
  sensor: { x: 0, y: 0, z: 8.5, tilt_x_deg: 0, tilt_y_deg: 0 },
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

describe('maxShapeHorizontalExtent', () => {
  it('returns the largest full-width dimension across all three levels', () => {
    expect(maxShapeHorizontalExtent(makeShape())).toBe(3.2)
  })

  it('picks up the largest dimension even when it is not on the top level', () => {
    expect(
      maxShapeHorizontalExtent(makeShape({ top_x_m: 1, top_y_m: 1, middle_x_m: 5 })),
    ).toBe(5)
  })
})

describe('sensorBoresightDirection', () => {
  const radDeg = (rad: number) => (rad * 180) / Math.PI

  it('points straight down when both tilt angles are zero', () => {
    const dir = sensorBoresightDirection({ tilt_x_deg: 0, tilt_y_deg: 0 })
    expect(dir).toEqual({ x: 0, y: 0, z: -1 })
  })

  it('round-trips tilt_x_deg/tilt_y_deg as independent projection angles', () => {
    // Each tilt angle is defined as the angle from vertical of the boresight's
    // *projection* onto that one axis's vertical plane — i.e. atan2(dx, -dz)
    // must equal tilt_x_deg, and atan2(dy, -dz) must equal tilt_y_deg,
    // regardless of the other axis's angle. This is the property that a
    // naive two-sequential-rotations implementation gets wrong once both
    // angles are non-trivial (see the real UMB01 case below).
    const cases = [
      { tilt_x_deg: 0, tilt_y_deg: 30 },
      { tilt_x_deg: 30, tilt_y_deg: 0 },
      { tilt_x_deg: -41.6, tilt_y_deg: 41.3 }, // real UMB01 sensor mounting
      { tilt_x_deg: 20, tilt_y_deg: -55 },
    ]

    for (const { tilt_x_deg, tilt_y_deg } of cases) {
      const dir = sensorBoresightDirection({ tilt_x_deg, tilt_y_deg })
      expect(radDeg(Math.atan2(dir.x, -dir.z))).toBeCloseTo(tilt_x_deg, 5)
      expect(radDeg(Math.atan2(dir.y, -dir.z))).toBeCloseTo(tilt_y_deg, 5)
    }
  })

  it('returns a unit vector', () => {
    const dir = sensorBoresightDirection({ tilt_x_deg: -41.6, tilt_y_deg: 41.3 })
    const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z)
    expect(length).toBeCloseTo(1, 10)
  })

  it('always points downward (negative height component)', () => {
    const dir = sensorBoresightDirection({ tilt_x_deg: -41.6, tilt_y_deg: 41.3 })
    expect(dir.z).toBeLessThan(0)
  })
})
