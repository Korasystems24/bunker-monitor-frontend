import { useQueries, useQuery } from '@tanstack/react-query'
import { POLL_INTERVAL_MS } from '../config'
import { bunkersApi } from './bunkers'
import type { BunkerInfo, MeasurementSummary } from '../types'

export const queryKeys = {
  bunkers: () => ['bunkers'] as const,
  latestMeasurement: (bunkerId: string) => ['bunkers', bunkerId, 'latest'] as const,
  measurements: (bunkerId: string, params: object) =>
    ['bunkers', bunkerId, 'measurements', params] as const,
  stats: (bunkerId: string, period: string) => ['bunkers', bunkerId, 'stats', period] as const,
  geometry: (bunkerId: string) => ['bunkers', bunkerId, 'geometry'] as const,
  health: () => ['health'] as const,
  buildup: (bunkerId: string) => ['bunkers', bunkerId, 'buildup'] as const,
}

export function useBunkers() {
  return useQuery({
    queryKey: queryKeys.bunkers(),
    queryFn: bunkersApi.listBunkers,
    refetchInterval: POLL_INTERVAL_MS * 10,
  })
}

export function useLatestMeasurement(bunkerId: string) {
  return useQuery({
    queryKey: queryKeys.latestMeasurement(bunkerId),
    queryFn: () => bunkersApi.getLatestMeasurement(bunkerId),
    refetchInterval: POLL_INTERVAL_MS,
    enabled: Boolean(bunkerId),
  })
}

export function useMeasurements(
  bunkerId: string,
  params: { from?: string; to?: string; limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: queryKeys.measurements(bunkerId, params),
    queryFn: () => bunkersApi.getMeasurements(bunkerId, params),
    enabled: Boolean(bunkerId),
  })
}

export function useStats(bunkerId: string, period: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: queryKeys.stats(bunkerId, period),
    queryFn: () => bunkersApi.getStats(bunkerId, period),
    refetchInterval: POLL_INTERVAL_MS * 20,
    enabled: Boolean(bunkerId),
  })
}

export function useGeometry(bunkerId: string) {
  return useQuery({
    queryKey: queryKeys.geometry(bunkerId),
    queryFn: () => bunkersApi.getGeometry(bunkerId),
    staleTime: Infinity, // geometry doesn't change during a session
    enabled: Boolean(bunkerId),
  })
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: bunkersApi.getHealth,
    refetchInterval: POLL_INTERVAL_MS * 5,
  })
}

export function useBuildup(bunkerId: string) {
  return useQuery({
    queryKey: queryKeys.buildup(bunkerId),
    queryFn: () => bunkersApi.getBuildup(bunkerId),
    refetchInterval: POLL_INTERVAL_MS * 10,
    enabled: Boolean(bunkerId),
  })
}

// Fetch the same per-bunker resource for every bunker at once — used by the alerts scan and
// the multi-bunker overview screen. Shares its cache with the single-bunker hooks above (same
// queryKey), so viewing a bunker's dashboard while its data is also polled here doesn't refetch
// twice. Slower poll interval than the live dashboard — this is for alerting/overview, not
// real-time display.
export function useAllLatestMeasurements(bunkers: BunkerInfo[] | undefined) {
  return useQueries({
    queries: (bunkers ?? []).map((b) => ({
      queryKey: queryKeys.latestMeasurement(b.id),
      queryFn: () => bunkersApi.getLatestMeasurement(b.id),
      refetchInterval: POLL_INTERVAL_MS * 5,
    })),
  })
}

export function useAllBuildup(bunkers: BunkerInfo[] | undefined) {
  return useQueries({
    queries: (bunkers ?? []).map((b) => ({
      queryKey: queryKeys.buildup(b.id),
      queryFn: () => bunkersApi.getBuildup(b.id),
      refetchInterval: POLL_INTERVAL_MS * 10,
    })),
  })
}

// Zip a bunkers list with the parallel per-bunker query results above into a lookup map —
// shared shape needed by both the alerts scan and the overview screen.
export function byBunkerId<T>(
  bunkers: BunkerInfo[] | undefined,
  results: Array<{ data: T | undefined }>,
): Record<string, T | undefined> {
  const map: Record<string, T | undefined> = {}
  ;(bunkers ?? []).forEach((b, i) => {
    map[b.id] = results[i]?.data
  })
  return map
}

// One-time fetch of all measurements for a period — used for CSV export, not React Query
export async function fetchAllMeasurements(
  bunkerId: string,
  from: string,
  to: string,
): Promise<MeasurementSummary[]> {
  const PAGE = 100
  let offset = 0
  const all: MeasurementSummary[] = []

  while (true) {
    const page = await bunkersApi.getMeasurements(bunkerId, { from, to, limit: PAGE, offset })
    all.push(...page.items)
    if (all.length >= page.total) break
    offset += PAGE
  }

  return all
}
