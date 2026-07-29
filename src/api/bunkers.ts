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
  listBunkers: () => apiFetch<BunkerInfo[]>('/api/v1/bunkers'),

  getLatestMeasurement: (bunkerId: string) =>
    apiFetch<Measurement>(`/api/v1/bunkers/${bunkerId}/measurements/latest`),

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
      `/api/v1/bunkers/${bunkerId}/measurements${query ? `?${query}` : ''}`,
    )
  },

  getStats: (bunkerId: string, period: 'day' | 'week' | 'month') =>
    apiFetch<BunkerStats>(`/api/v1/bunkers/${bunkerId}/stats?period=${period}`),

  getGeometry: (bunkerId: string) =>
    apiFetch<BunkerGeometry>(`/api/v1/bunkers/${bunkerId}/geometry`),

  getHealth: () => apiFetch<Health>('/api/v1/health'),

  getBuildup: (bunkerId: string) =>
    apiFetch<BuildupAnalysis>(`/api/v1/bunkers/${bunkerId}/buildup`),
}
