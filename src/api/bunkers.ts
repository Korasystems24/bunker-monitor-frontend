import type {
  BunkerInfo,
  BunkerGeometry,
  BunkerStats,
  BuildupAnalysis,
  Health,
  Measurement,
  MeasurementsPage,
} from '../types'
import { apiFetch } from './client'

export const bunkersApi = {
  listBunkers: () => apiFetch<BunkerInfo[]>('/bunkers'),

  getLatestMeasurement: (bunkerId: string) =>
    apiFetch<Measurement>(`/bunkers/${encodeURIComponent(bunkerId)}/measurements/latest`),

  getMeasurements: (
    bunkerId: string,
    params: { from?: string; to?: string; limit?: number; offset?: number },
  ) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    if (params.offset !== undefined) qs.set('offset', String(params.offset))
    const query = qs.toString()
    return apiFetch<MeasurementsPage>(
      `/bunkers/${encodeURIComponent(bunkerId)}/measurements${query ? `?${query}` : ''}`,
    )
  },

  getStats: (bunkerId: string, period: 'day' | 'week' | 'month') =>
    apiFetch<BunkerStats>(`/bunkers/${encodeURIComponent(bunkerId)}/stats?period=${period}`),

  getGeometry: (bunkerId: string) =>
    apiFetch<BunkerGeometry>(`/bunkers/${encodeURIComponent(bunkerId)}/geometry`),

  getHealth: () => apiFetch<Health>('/health'),

  getBuildup: (bunkerId: string) =>
    apiFetch<BuildupAnalysis>(`/bunkers/${encodeURIComponent(bunkerId)}/buildup`),
}
