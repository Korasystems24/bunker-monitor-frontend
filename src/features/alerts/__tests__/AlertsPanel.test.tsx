import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AlertsPanel } from '../AlertsPanel'
import type { Alert } from '../../../types'

const alert = (overrides: Partial<Alert> = {}): Alert => ({
  id: 'edge:edge-1',
  severity: 'critical',
  category: 'edge',
  message: 'Edge PC «edge-1» offline',
  ts: '2026-06-22T10:00:00.000Z',
  ...overrides,
})

describe('AlertsPanel', () => {
  it('shows a placeholder message when there are no alerts', () => {
    render(<AlertsPanel alerts={[]} />, { wrapper: MemoryRouter })
    expect(screen.getByText('Активных алертов нет')).toBeInTheDocument()
  })

  it('renders each alert message', () => {
    const alerts = [alert(), alert({ id: 'bunker:b1', message: 'Бункер «Бункер 1» offline' })]
    render(<AlertsPanel alerts={alerts} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Edge PC «edge-1» offline')).toBeInTheDocument()
    expect(screen.getByText('Бункер «Бункер 1» offline')).toBeInTheDocument()
  })

  it('wraps alerts with a bunkerId in a link to that bunker dashboard', () => {
    render(
      <AlertsPanel
        alerts={[alert({ id: 'bunker:b1', bunkerId: 'b1', message: 'Бункер «Бункер 1» offline' })]}
      />,
      { wrapper: MemoryRouter },
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/bunkers/b1')
  })

  it('does not render a link for alerts with no associated bunker', () => {
    render(<AlertsPanel alerts={[alert()]} />, { wrapper: MemoryRouter })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('calls onNavigate when a linked alert is clicked', async () => {
    const onNavigate = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(
      <AlertsPanel
        alerts={[alert({ id: 'bunker:b1', bunkerId: 'b1' })]}
        onNavigate={onNavigate}
      />,
      { wrapper: MemoryRouter },
    )
    await user.click(screen.getByRole('link'))
    expect(onNavigate).toHaveBeenCalled()
  })
})
