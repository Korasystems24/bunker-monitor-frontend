import type { MeasurementSummary } from '../types'
import { UNITS } from '../config'

// Escape a CSV field value: wrap in quotes if it contains comma, newline, or quote
function escapeField(value: string | number | null): string {
  if (value === null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(fields: (string | number | null)[]): string {
  return fields.map(escapeField).join(',')
}

export function measurementsToCsv(measurements: MeasurementSummary[]): string {
  const header = row([
    'id',
    `ts_utc`,
    `avg_level_${UNITS.level}`,
    `mass_${UNITS.mass}`,
    `volume_${UNITS.volume}`,
  ])

  const lines = measurements.map((m) =>
    row([
      m.id,
      m.ts,
      m.avg_level,
      m.mass,
      m.volume,
    ]),
  )

  return [header, ...lines].join('\r\n')
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
