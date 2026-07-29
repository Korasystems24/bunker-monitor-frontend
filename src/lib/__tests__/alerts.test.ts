import { describe, it, expect } from 'vitest'
import { computeAlerts } from '../alerts'
import type { Beam, BuildupAnalysis, BunkerInfo, Measurement } from '../../types'

const makeBunker = (id: string, name: string, online = true): BunkerInfo => ({
  id,
  name,
  online,
  geometry_id: `geom-${id}`,
})

const makeBeam = (beam_name: string, height: number, status = ''): Beam => ({
  beam_name,
  height,
  status,
})

const makeMeasurement = (beams: Beam[], ts = '2026-06-22T10:00:00.000Z'): Measurement => ({
  id: 1,
  ts,
  avg_level: 2.5,
  min_level: 1.0,
  max_level: 4.0,
  mass: 39.5,
  volume: 17.2,
  beams,
})

const makeBuildup = (
  zones: BuildupAnalysis['zones'],
  ts = '2026-06-22T10:00:00.000Z',
): BuildupAnalysis => ({
  bunker_id: 'b1',
  ts,
  threshold_m: 0.35,
  zones,
})

const zone = (axis: string, severity: string) => ({
  axis,
  severity,
  score: 0,
  deviation_m: 0.5,
  affected_positions: [7, 8],
})

describe('computeAlerts', () => {
  it('returns no alerts for healthy bunkers with no anomalies', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: { edge_pcs: [{ node_id: 'edge-1', online: true, last_pulse: '', cpu: 1, ram: 1, disk: 1 }] },
      measurementsByBunker: { b1: makeMeasurement([makeBeam('A1', 2.5)]) },
      buildupByBunker: { b1: makeBuildup([zone('A', 'none')]) },
    })
    expect(alerts).toEqual([])
  })

  it('flags an offline edge PC as critical', () => {
    const alerts = computeAlerts({
      bunkers: [],
      health: { edge_pcs: [{ node_id: 'edge-1', online: false, last_pulse: 't', cpu: 1, ram: 1, disk: 1 }] },
      measurementsByBunker: {},
      buildupByBunker: {},
    })
    expect(alerts).toEqual([
      { id: 'edge:edge-1', severity: 'critical', category: 'edge', message: 'Edge PC «edge-1» offline', ts: 't' },
    ])
  })

  it('flags an offline bunker as critical', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1', false)],
      health: undefined,
      measurementsByBunker: {},
      buildupByBunker: {},
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ id: 'bunker:b1', severity: 'critical', category: 'bunker', bunkerId: 'b1' })
  })

  it('does not raise a buildup alert for severity "none"', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: undefined,
      measurementsByBunker: {},
      buildupByBunker: { b1: makeBuildup([zone('A', 'none')]) },
    })
    expect(alerts).toEqual([])
  })

  it('treats buildup severity "low" as a warning', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: undefined,
      measurementsByBunker: {},
      buildupByBunker: { b1: makeBuildup([zone('A', 'low')]) },
    })
    expect(alerts).toEqual([
      expect.objectContaining({ id: 'buildup:b1:A', severity: 'warning', category: 'buildup' }),
    ])
  })

  it.each(['medium', 'high', 'future-unknown-flag'])(
    'escalates buildup severity "%s" to critical (fail-safe for unrecognised values)',
    (severity) => {
      const alerts = computeAlerts({
        bunkers: [makeBunker('b1', 'Бункер 1')],
        health: undefined,
        measurementsByBunker: {},
        buildupByBunker: { b1: makeBuildup([zone('A', severity)]) },
      })
      expect(alerts[0]?.severity).toBe('critical')
    },
  )

  it('raises one buildup alert per flagged axis', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: undefined,
      measurementsByBunker: {},
      buildupByBunker: { b1: makeBuildup([zone('A', 'low'), zone('B', 'high'), zone('C', 'none')]) },
    })
    expect(alerts.map((a) => a.id).sort()).toEqual(['buildup:b1:A', 'buildup:b1:B'])
  })

  it('does not raise a degradation alert at or below the threshold', () => {
    // 30% of 8 beams = 2.4 → 2 unreliable beams is at/below the 30% threshold
    const beams = [
      makeBeam('A1', 2.5, 'Disabled'),
      makeBeam('A2', 2.5, 'Disabled'),
      ...Array.from({ length: 6 }, (_, i) => makeBeam(`A${i + 3}`, 2.5)),
    ]
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: undefined,
      measurementsByBunker: { b1: makeMeasurement(beams) },
      buildupByBunker: {},
    })
    expect(alerts).toEqual([])
  })

  it('raises a degradation warning above the threshold', () => {
    // 5 of 8 beams unreliable = 62.5% > 30% threshold
    const beams = [
      ...Array.from({ length: 5 }, (_, i) => makeBeam(`A${i + 1}`, 0, 'Disabled')),
      ...Array.from({ length: 3 }, (_, i) => makeBeam(`A${i + 6}`, 2.5)),
    ]
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: undefined,
      measurementsByBunker: { b1: makeMeasurement(beams) },
      buildupByBunker: {},
    })
    expect(alerts).toEqual([
      expect.objectContaining({ id: 'degradation:b1', severity: 'warning', category: 'degradation' }),
    ])
  })

  it('sorts critical alerts before warnings', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1')],
      health: { edge_pcs: [{ node_id: 'edge-1', online: false, last_pulse: 't', cpu: 1, ram: 1, disk: 1 }] },
      measurementsByBunker: {},
      buildupByBunker: { b1: makeBuildup([zone('A', 'low')]) },
    })
    expect(alerts.map((a) => a.severity)).toEqual(['critical', 'warning'])
  })

  it('combines alerts across multiple bunkers', () => {
    const alerts = computeAlerts({
      bunkers: [makeBunker('b1', 'Бункер 1', false), makeBunker('b2', 'Бункер 2', true)],
      health: undefined,
      measurementsByBunker: {},
      buildupByBunker: { b2: makeBuildup([zone('F', 'high')]) },
    })
    expect(alerts.map((a) => a.id).sort()).toEqual(['bunker:b1', 'buildup:b2:F'].sort())
  })
})
