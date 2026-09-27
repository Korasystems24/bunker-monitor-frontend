import { describe, it, expect } from 'vitest'
import { buildSurfaceGrid, computeCenterHeight } from '../interpolateSurface'
import { parseBeam } from '../parseMeasurement'
import { BEAM_AXES, BEAM_POSITIONS } from '../../config'
import type { Beam, ParsedBeam } from '../../types'

const makeBeam = (beam_name: string, height: number, status = ''): Beam => ({
  beam_name,
  height,
  status,
})

/** Full 8×8 set of parsed beams, height = axisIndex + position, all reliable unless overridden. */
function makeFullGrid(overrides: Record<string, Beam> = {}): ParsedBeam[] {
  const beams: Beam[] = []
  BEAM_AXES.forEach((axis, axisIdx) => {
    BEAM_POSITIONS.forEach((position) => {
      const name = `${axis}${position}`
      beams.push(overrides[name] ?? makeBeam(name, axisIdx + position))
    })
  })
  return beams.map(parseBeam)
}

describe('buildSurfaceGrid', () => {
  it('uses the exact beam height for every reliable cell, marked as not interpolated', () => {
    const grid = buildSurfaceGrid(makeFullGrid())
    grid.forEach((row, axisIdx) => {
      row.forEach((cell, posIdx) => {
        expect(cell.height).toBe(axisIdx + (posIdx + 1))
        expect(cell.interpolated).toBe(false)
      })
    })
  })

  it('fills a single unreliable cell by averaging its 4-connected neighbours', () => {
    // B4 (axisIdx=1, position=4) unreliable; neighbours: A4(0+4=4), C4(2+4=6), B3(1+3=4), B5(1+5=6)
    // average = (4 + 6 + 4 + 6) / 4 = 5
    const beams = makeFullGrid({ B4: makeBeam('B4', 0, 'Disabled') })
    const grid = buildSurfaceGrid(beams)
    const cell = grid[1][3] // axis B, position 4
    expect(cell.height).toBeCloseTo(5, 5)
    expect(cell.interpolated).toBe(true)
  })

  it('falls back to the global average of reliable heights when no reliable beams exist', () => {
    const beams = BEAM_AXES.flatMap((axis) =>
      BEAM_POSITIONS.map((position) => makeBeam(`${axis}${position}`, 0, 'Disabled')),
    ).map(parseBeam)
    const grid = buildSurfaceGrid(beams)
    grid.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.height).toBe(0)
        expect(cell.interpolated).toBe(true)
      })
    })
  })

  it('uses a NotUsed height when showAllExceptDisabled is set, and still skips Disabled', () => {
    const beams = makeFullGrid({
      B4: makeBeam('B4', 9, 'NotUsed, WeakSignal'),
      C4: makeBeam('C4', 8, 'Disabled'),
    })
    const grid = buildSurfaceGrid(beams, { showAllExceptDisabled: true })
    expect(grid[1][3].height).toBe(9)
    expect(grid[1][3].interpolated).toBe(false)
    expect(grid[2][3].interpolated).toBe(true)
    expect(grid[2][3].height).not.toBe(8)
  })

  it('does not let an unreliable height (e.g. 5.0) pull the interpolated value toward it', () => {
    // A misleading raw height on the unreliable beam must be ignored entirely
    const beams = makeFullGrid({ B4: makeBeam('B4', 999, 'Disabled') })
    const grid = buildSurfaceGrid(beams)
    expect(grid[1][3].height).toBeCloseTo(5, 5)
  })

  it('propagates fill across an entire disabled axis using neighbouring axes', () => {
    const disabledAxis = 'D'
    const overrides: Record<string, Beam> = {}
    BEAM_POSITIONS.forEach((position) => {
      overrides[`${disabledAxis}${position}`] = makeBeam(`${disabledAxis}${position}`, 0, 'Disabled')
    })
    const beams = makeFullGrid(overrides)
    const grid = buildSurfaceGrid(beams)
    const axisIdx = BEAM_AXES.indexOf(disabledAxis)
    grid[axisIdx].forEach((cell) => {
      expect(cell.interpolated).toBe(true)
      expect(Number.isFinite(cell.height)).toBe(true)
    })
  })
})

describe('computeCenterHeight', () => {
  it('averages the innermost (position 1) cells across all axes', () => {
    const grid = buildSurfaceGrid(makeFullGrid())
    // position 1 height = axisIdx + 1, axisIdx 0..7 → average = (1+2+...+8)/8 = 4.5
    expect(computeCenterHeight(grid)).toBeCloseTo(4.5, 5)
  })
})
