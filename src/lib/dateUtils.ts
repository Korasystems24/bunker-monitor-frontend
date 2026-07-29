import type { BunkerStats } from '../types'

export type Period = BunkerStats['period']

export function getPeriodRange(period: Period): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  if (period === 'day') from.setDate(from.getDate() - 1)
  else if (period === 'week') from.setDate(from.getDate() - 7)
  else from.setMonth(from.getMonth() - 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'Сутки',
  week: 'Неделя',
  month: 'Месяц',
}
