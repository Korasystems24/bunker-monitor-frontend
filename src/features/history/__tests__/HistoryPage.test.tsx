import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HistoryPage } from '../HistoryPage'
import type { BunkerInfo, BunkerStats } from '../../../types'

const { useBunkers, useStats } = vi.hoisted(() => ({
  useBunkers: vi.fn(),
  useStats: vi.fn(),
}))

vi.mock('../../../api/hooks', () => ({
  useBunkers,
  useStats,
  fetchAllMeasurements: vi.fn(),
}))

// Charts pull in recharts' ResponsiveContainer, which needs real layout —
// irrelevant to the bunkerId-from-route behavior under test, so stub them out.
vi.mock('../LevelChart', () => ({ LevelChart: () => <div data-testid="level-chart" /> }))
vi.mock('../MassVolumeChart', () => ({ MassVolumeChart: () => <div data-testid="mass-volume-chart" /> }))

const makeBunker = (id: string, name: string): BunkerInfo => ({
  id,
  name,
  online: true,
  geometry_id: 'geo-1',
})

const makeStats = (): BunkerStats => ({
  period: 'day',
  min_level: 1,
  avg_level: 2,
  max_level: 3,
  series: [{ ts: '2026-06-22T10:00:00.000Z', avg_level: 2, min_level: 1, max_level: 3, mass: 10, volume: 5 }],
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div data-testid="overview-stub" />} />
        <Route path="/bunkers/:bunkerId/history" element={<HistoryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HistoryPage — bunkerId from the route', () => {
  it('requests stats for the bunkerId in the URL, not a locally-managed selection', () => {
    useBunkers.mockReturnValue({
      data: [makeBunker('b1', 'Бункер 1'), makeBunker('b2', 'Бункер 2')],
      isLoading: false,
    })
    useStats.mockReturnValue({ data: makeStats(), isLoading: false, error: null })

    renderAt('/bunkers/b2/history')

    expect(useStats).toHaveBeenCalledWith('b2', 'day')
  })

  it('shows the matching bunker name in the heading', () => {
    useBunkers.mockReturnValue({ data: [makeBunker('b1', 'Бункер 1')], isLoading: false })
    useStats.mockReturnValue({ data: makeStats(), isLoading: false, error: null })

    renderAt('/bunkers/b1/history')

    expect(screen.getByText(/История замеров — Бункер 1/)).toBeInTheDocument()
  })

  it('redirects to the overview page when the bunkerId does not match any known bunker', () => {
    useBunkers.mockReturnValue({ data: [makeBunker('b1', 'Бункер 1')], isLoading: false })
    useStats.mockReturnValue({ data: undefined, isLoading: false, error: null })

    renderAt('/bunkers/unknown-id/history')

    expect(screen.getByTestId('overview-stub')).toBeInTheDocument()
  })

  it('does not redirect while the bunkers list is still loading', () => {
    useBunkers.mockReturnValue({ data: undefined, isLoading: true })
    useStats.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderAt('/bunkers/b1/history')

    expect(screen.queryByTestId('overview-stub')).not.toBeInTheDocument()
  })

  it('shows a loading state while bunkers or stats are loading', () => {
    useBunkers.mockReturnValue({ data: undefined, isLoading: true })
    useStats.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderAt('/bunkers/b1/history')

    expect(screen.queryByTestId('level-chart')).not.toBeInTheDocument()
  })

  it('shows an error message when stats fail to load', () => {
    useBunkers.mockReturnValue({ data: [makeBunker('b1', 'Бункер 1')], isLoading: false })
    useStats.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') })

    renderAt('/bunkers/b1/history')

    expect(screen.getByText(/Не удалось загрузить историю/)).toBeInTheDocument()
  })
})
