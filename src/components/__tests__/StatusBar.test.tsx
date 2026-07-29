import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBar } from '../StatusBar'

describe('StatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-22T10:00:30.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows "Связь" when connected', () => {
    render(<StatusBar isConnected={true} lastFetchTime={null} errorMessage={null} />)
    expect(screen.getByText('Связь')).toBeInTheDocument()
  })

  it('shows "Нет связи" when not connected', () => {
    render(<StatusBar isConnected={false} lastFetchTime={null} errorMessage={null} />)
    expect(screen.getByText('Нет связи')).toBeInTheDocument()
  })

  it('renders the last fetch time when provided', () => {
    render(
      <StatusBar
        isConnected={true}
        lastFetchTime="2026-06-22T10:00:00.000Z"
        errorMessage={null}
      />,
    )
    expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
  })

  it('does not render a last-fetch line when null', () => {
    render(<StatusBar isConnected={true} lastFetchTime={null} errorMessage={null} />)
    expect(screen.queryByText(/Обновлено:/)).not.toBeInTheDocument()
  })

  it('renders the error message when provided', () => {
    render(
      <StatusBar isConnected={false} lastFetchTime={null} errorMessage="Ошибка соединения" />,
    )
    expect(screen.getByText('Ошибка соединения')).toBeInTheDocument()
  })
})
