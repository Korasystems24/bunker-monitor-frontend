import { useMemo } from 'react'
import { useBunkers, useHealth, useAllLatestMeasurements, useAllBuildup, byBunkerId } from '../../api/hooks'
import { computeAlerts } from '../../lib/alerts'

/**
 * Cross-bunker alert scan — independent of whichever bunker the operator currently has open.
 * Polls health + every bunker's latest measurement/buildup (shares cache with the per-bunker
 * dashboard hooks) and derives the alert list via the pure computeAlerts().
 */
export function useAlerts() {
  const { data: bunkers } = useBunkers()
  const { data: health } = useHealth()
  const measurementResults = useAllLatestMeasurements(bunkers)
  const buildupResults = useAllBuildup(bunkers)

  return useMemo(
    () =>
      computeAlerts({
        bunkers: bunkers ?? [],
        health,
        measurementsByBunker: byBunkerId(bunkers, measurementResults),
        buildupByBunker: byBunkerId(bunkers, buildupResults),
      }),
    [bunkers, health, measurementResults, buildupResults],
  )
}
