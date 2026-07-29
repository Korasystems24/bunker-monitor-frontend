import { UNITS } from '../config'

/**
 * Format level value with unit.
 * Assumption: avg_level in metres — see README open questions.
 */
export function formatLevel(value: number | null | undefined, decimals = 2): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value.toFixed(decimals)} ${UNITS.level}`
}

/**
 * Format volume with unit.
 * Assumption: volume in m³ — see README open questions.
 */
export function formatVolume(value: number | null | undefined, decimals = 2): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value.toFixed(decimals)} ${UNITS.volume}`
}

/**
 * Format mass with unit.
 * Assumption: mass in tonnes — see README open questions.
 */
export function formatMass(value: number | null | undefined, decimals = 3): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value.toFixed(decimals)} ${UNITS.mass}`
}

/**
 * Format ISO-8601 UTC timestamp to local time string.
 * Store/compare in UTC, display in local time.
 */
export function formatTimestamp(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  try {
    const date = new Date(isoUtc)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return isoUtc
  }
}

/**
 * Short date/time for chart axis ticks. Shows time if today, date+time otherwise.
 */
export function formatDateTimeShort(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  try {
    const date = new Date(isoUtc)
    const isToday =
      new Date().toDateString() === date.toDateString()
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoUtc
  }
}

/**
 * Format relative time (e.g. "5 с назад") for status bar.
 */
export function formatRelativeTime(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  const diffMs = Date.now() - new Date(isoUtc).getTime()
  const diffS = Math.round(diffMs / 1000)
  if (diffS < 60) return `${diffS} с назад`
  const diffM = Math.round(diffS / 60)
  if (diffM < 60) return `${diffM} мин назад`
  return formatTimestamp(isoUtc)
}
