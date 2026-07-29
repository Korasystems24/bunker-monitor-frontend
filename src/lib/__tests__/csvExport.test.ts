import { describe, it, expect } from 'vitest'
import { measurementsToCsv } from '../csvExport'
import type { Measurement } from '../../types'

const makeMeasurement = (overrides: Partial<Measurement> = {}): Measurement => ({
  id: 1,
  ts: '2026-06-22T10:00:00.000Z',
  avg_level: 3.14,
  min_level: 2.10,
  max_level: 4.20,
  mass: 39.5,
  volume: 17.2,
  beams: [],
  ...overrides,
})

describe('measurementsToCsv', () => {
  it('returns only header row for empty array', () => {
    const csv = measurementsToCsv([])
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('id')
    expect(lines[0]).toContain('ts_utc')
    expect(lines[0]).toContain('avg_level')
  })

  it('produces one data row per measurement', () => {
    const csv = measurementsToCsv([makeMeasurement(), makeMeasurement({ id: 2 })])
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(3) // header + 2 data rows
  })

  it('includes id, ts, avg_level, mass, volume in each row', () => {
    const m = makeMeasurement({ id: 42, avg_level: 3.14, mass: 39.5, volume: 17.2 })
    const csv = measurementsToCsv([m])
    const dataRow = csv.split('\r\n')[1]
    expect(dataRow).toBeDefined()
    expect(dataRow).toContain('42')
    expect(dataRow).toContain('2026-06-22T10:00:00.000Z')
    expect(dataRow).toContain('3.14')
    expect(dataRow).toContain('39.5')
    expect(dataRow).toContain('17.2')
  })

  it('escapes field containing a comma with double quotes', () => {
    // ts field won't have commas but let's test via a numeric trick:
    // The escapeField function is private, so we test indirectly via a ts that contains comma
    const m = makeMeasurement({ ts: '2026,special' })
    const csv = measurementsToCsv([m])
    expect(csv).toContain('"2026,special"')
  })

  it('escapes field containing a double-quote by doubling it', () => {
    const m = makeMeasurement({ ts: 'say "hello"' })
    const csv = measurementsToCsv([m])
    expect(csv).toContain('"say ""hello"""')
  })

  it('uses CRLF line endings', () => {
    const csv = measurementsToCsv([makeMeasurement()])
    expect(csv).toContain('\r\n')
  })

  it('header includes unit suffixes', () => {
    const csv = measurementsToCsv([])
    const header = csv.split('\r\n')[0]
    expect(header).toBeDefined()
    expect(header).toMatch(/avg_level_м/)
    expect(header).toMatch(/mass_т/)
    expect(header).toMatch(/volume_м³/)
  })
})
