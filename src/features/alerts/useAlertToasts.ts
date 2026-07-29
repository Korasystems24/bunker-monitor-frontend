import { useEffect, useRef, useState } from 'react'
import type { Alert } from '../../types'
import { ALERT_TOAST_DURATION_MS } from '../../config'

/**
 * Turns the polled alert list into transient toasts — fires one the first time an alert id
 * appears, then auto-dismisses it. If the condition clears and later recurs (id disappears then
 * reappears), it toasts again — this only suppresses repeat toasts for a *still-ongoing* alert.
 */
export function useAlertToasts(alerts: Alert[]) {
  const [toasts, setToasts] = useState<Alert[]>([])
  const seenIds = useRef(new Set<string>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const currentIds = new Set(alerts.map((a) => a.id))
    const fresh = alerts.filter((a) => !seenIds.current.has(a.id))

    if (fresh.length > 0) {
      setToasts((prev) => [...prev, ...fresh])
      fresh.forEach((alert) => {
        seenIds.current.add(alert.id)
        const timer = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== alert.id))
          timers.current.delete(alert.id)
        }, ALERT_TOAST_DURATION_MS)
        timers.current.set(alert.id, timer)
      })
    }

    for (const id of seenIds.current) {
      if (!currentIds.has(id)) seenIds.current.delete(id)
    }
  }, [alerts])

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }

  return { toasts, dismiss }
}
