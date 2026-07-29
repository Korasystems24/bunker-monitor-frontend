import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUnseenAlerts } from '../useUnseenAlerts'
import type { Alert } from '../../../types'

const alert = (id: string, overrides: Partial<Alert> = {}): Alert => ({
  id,
  severity: 'warning',
  category: 'bunker',
  message: `message for ${id}`,
  ts: '2026-06-22T10:00:00.000Z',
  ...overrides,
})

describe('useUnseenAlerts', () => {
  it('treats every alert as unseen before markAllSeen has been called', () => {
    const { result } = renderHook(({ alerts }) => useUnseenAlerts(alerts), {
      initialProps: { alerts: [alert('a'), alert('b')] },
    })
    expect(result.current.unseenAlerts.map((a) => a.id)).toEqual(['a', 'b'])
  })

  it('clears unseen alerts once markAllSeen is called', () => {
    const { result, rerender } = renderHook(({ alerts }) => useUnseenAlerts(alerts), {
      initialProps: { alerts: [alert('a'), alert('b')] },
    })

    act(() => result.current.markAllSeen())
    rerender({ alerts: [alert('a'), alert('b')] })

    expect(result.current.unseenAlerts).toHaveLength(0)
  })

  it('counts a brand-new alert as unseen even though earlier ones were acknowledged', () => {
    const { result, rerender } = renderHook(({ alerts }) => useUnseenAlerts(alerts), {
      initialProps: { alerts: [alert('a')] },
    })
    act(() => result.current.markAllSeen())
    rerender({ alerts: [alert('a')] })
    expect(result.current.unseenAlerts).toHaveLength(0)

    rerender({ alerts: [alert('a'), alert('b')] })
    expect(result.current.unseenAlerts.map((a) => a.id)).toEqual(['b'])
  })

  it('treats a resolved-then-recurred alert as unseen again', () => {
    const { result, rerender } = renderHook(({ alerts }) => useUnseenAlerts(alerts), {
      initialProps: { alerts: [alert('a')] },
    })
    act(() => result.current.markAllSeen())
    rerender({ alerts: [alert('a')] })
    expect(result.current.unseenAlerts).toHaveLength(0)

    // Condition resolves — alert drops out of the list
    rerender({ alerts: [] })
    // Condition recurs with the same id
    rerender({ alerts: [alert('a')] })
    expect(result.current.unseenAlerts.map((a) => a.id)).toEqual(['a'])
  })

  it('markAllSeen is a no-op for alerts that no longer exist', () => {
    const { result, rerender } = renderHook(({ alerts }) => useUnseenAlerts(alerts), {
      initialProps: { alerts: [alert('a')] },
    })
    act(() => result.current.markAllSeen())
    rerender({ alerts: [alert('a'), alert('b')] })
    expect(result.current.unseenAlerts.map((a) => a.id)).toEqual(['b'])
  })
})
