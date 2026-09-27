import { describe, expect, it } from 'vitest'
import { detectBuildupExceptDisabled } from '../detectBuildup'
import type { Beam } from '../../types'

const THRESHOLD = 0.35

function beamsFor(
  axis: string,
  heights: Array<{ position: number; height: number; status?: string }>,
): Beam[] {
  return heights.map(({ position, height, status = '' }) => ({
    beam_name: `${axis}${position}`,
    height,
    status,
  }))
}

function zone(beams: Beam[], axis: string) {
  return detectBuildupExceptDisabled(beams, THRESHOLD).find((item) => item.axis === axis)
}

describe('detectBuildupExceptDisabled', () => {
  it('reports every axis and ignores a flat profile', () => {
    const beams = beamsFor(
      'A',
      [1, 2, 3, 4, 5, 6, 7, 8].map((position) => ({ position, height: 2 })),
    )
    const zones = detectBuildupExceptDisabled(beams, THRESHOLD)
    expect(zones.map((item) => item.axis)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    expect(zone(beams, 'A')).toMatchObject({ severity: 'none', score: 0, affected_positions: [] })
  })

  it('flags an outer bump above the inner slope', () => {
    const beams = beamsFor('C', [
      ...[1, 2, 3, 4, 5].map((position) => ({
        position,
        height: 3 - 0.1 * (position - 1),
      })),
      ...[6, 7, 8].map((position) => ({
        position,
        height: 3 - 0.1 * (position - 1) + 1,
      })),
    ])
    expect(zone(beams, 'C')).toMatchObject({
      severity: 'high',
      affected_positions: [6, 7, 8],
      deviation_m: 1,
    })
  })

  it('keeps a NotUsed outer beam in the fit and still drops Disabled', () => {
    const notUsed = beamsFor(
      'D',
      [1, 2, 3, 4, 5, 6, 7, 8].map((position) => ({
        position,
        height: position === 8 ? 4 : 2,
        status: position === 8 ? 'NotUsed, WeakSignal' : '',
      })),
    )
    expect(zone(notUsed, 'D')).toMatchObject({
      severity: 'high',
      affected_positions: [8],
    })

    const disabled = beamsFor(
      'D',
      [1, 2, 3, 4, 5, 6, 7, 8].map((position) => ({
        position,
        height: position === 8 ? 4 : 2,
        status: position === 8 ? 'Disabled' : '',
      })),
    )
    expect(zone(disabled, 'D')).toMatchObject({
      severity: 'none',
      deviation_m: 0,
      affected_positions: [],
    })
  })

  it('does not flag a deviation below the backend threshold', () => {
    const beams = beamsFor('B', [
      ...[1, 2, 3, 4, 5].map((position) => ({
        position,
        height: 2.5 - 0.05 * (position - 1),
      })),
      ...[6, 7, 8].map((position) => ({
        position,
        height: 2.5 - 0.05 * (position - 1) + 0.2,
      })),
    ])
    expect(zone(beams, 'B')).toMatchObject({
      severity: 'none',
      affected_positions: [],
    })
    expect(zone(beams, 'B')?.deviation_m).toBeCloseTo(0.2, 3)
  })

  it('returns none when fewer than two inner beams are usable', () => {
    const beams = beamsFor('A', [
      { position: 1, height: 2 },
      { position: 6, height: 2 },
      { position: 7, height: 5 },
    ])
    expect(zone(beams, 'A')).toMatchObject({ severity: 'none', score: 0, deviation_m: 0 })
  })
})
