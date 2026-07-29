import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAlertToasts } from '../useAlertToasts'
import type { Alert } from '../../../types'
import { ALERT_TOAST_DURATION_MS } from '../../../config'

const alert = (id: string, overrides: Partial<Alert> = {}): Alert => ({
  id,
  severity: 'warning',
  category: 'bunker',
  message: `message for ${id}`,
  ts: '2026-06-22T10:00:00.000Z',
  ...overrides,
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAlertToasts', () => {
  it('toasts a brand-new alert', () => {
    const { result, rerender } = renderHook(({ alerts }) => useAlertToasts(alerts), {
      initialProps: { alerts: [] as Alert[] },
    })
    expect(result.current.toasts).toEqual([])

    rerender({ alerts: [alert('bunker:b1')] })
    expect(result.current.toasts.map((t) => t.id)).toEqual(['bunker:b1'])
  })

  it('does not re-toast the same still-ongoing alert on subsequent polls', () => {
    const { result, rerender } = renderHook(({ alerts }) => useAlertToasts(alerts), {
      initialProps: { alerts: [alert('bunker:b1')] },
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss('bunker:b1')
    })
    expect(result.current.toasts).toHaveLength(0)

    // Same alert, new array reference (as a fresh poll would produce) — should NOT reappear
    rerender({ alerts: [alert('bunker:b1', { ts: '2026-06-22T10:05:00.000Z' })] })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-dismisses a toast after ALERT_TOAST_DURATION_MS', () => {
    const { result } = renderHook(({ alerts }) => useAlertToasts(alerts), {
      initialProps: { alerts: [alert('edge:edge-1')] },
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(ALERT_TOAST_DURATION_MS + 100)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('toasts again once a resolved alert recurs', () => {
    const { result, rerender } = renderHook(({ alerts }) => useAlertToasts(alerts), {
      initialProps: { alerts: [alert('degradation:b1')] },
    })
    expect(result.current.toasts).toHaveLength(1)

    // Condition clears
    rerender({ alerts: [] })
    act(() => {
      vi.advanceTimersByTime(ALERT_TOAST_DURATION_MS + 100)
    })
    expect(result.current.toasts).toHaveLength(0)

    // Condition recurs — should toast again
    rerender({ alerts: [alert('degradation:b1')] })
    expect(result.current.toasts).toHaveLength(1)
  })

  it('dismiss() removes only the targeted toast', () => {
    const { result } = renderHook(({ alerts }) => useAlertToasts(alerts), {
      initialProps: { alerts: [alert('a'), alert('b')] },
    })
    expect(result.current.toasts).toHaveLength(2)

    act(() => {
      result.current.dismiss('a')
    })
    expect(result.current.toasts.map((t) => t.id)).toEqual(['b'])
  })
})
