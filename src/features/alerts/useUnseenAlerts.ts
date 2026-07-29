import { useEffect, useState } from 'react'
import type { Alert } from '../../types'

export interface UnseenAlerts {
  unseenAlerts: Alert[]
  /** Call when the operator opens the alerts dropdown — marks every currently-listed alert seen. */
  markAllSeen: () => void
}

/**
 * Tracks which alert ids the operator has already acknowledged (via markAllSeen, called when the
 * bell dropdown is opened). If an alert later resolves and recurs with the same id, it's pruned
 * from the seen set the moment it drops out of the current list, so it counts as unseen again on
 * recurrence — same "still-ongoing vs resolved-then-recurred" rule as the toast dedup in
 * useAlertToasts. A brand-new alert counts as unseen immediately, even if the dropdown happens to
 * already be open — acknowledgement only happens on the explicit open action, not continuously.
 */
export function useUnseenAlerts(alerts: Alert[]): UnseenAlerts {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  // Forget ids that are no longer present, so a resolved-then-recurred alert is unseen again.
  useEffect(() => {
    setSeenIds((prev) => {
      const currentIds = new Set(alerts.map((a) => a.id))
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (currentIds.has(id)) {
          next.add(id)
        } else {
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [alerts])

  function markAllSeen() {
    setSeenIds(new Set(alerts.map((a) => a.id)))
  }

  return { unseenAlerts: alerts.filter((a) => !seenIds.has(a.id)), markAllSeen }
}
