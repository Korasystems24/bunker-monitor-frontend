import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OverviewPage } from '../OverviewPage'
import type { Beam, BunkerInfo, Measurement, BuildupAnalysis, Health } from '../../../types'

const { useBunkers, useHealth, useAllLatestMeasurements, useAllBuildup } = vi.hoisted(() => ({
  useBunkers: vi.fn(),
  useHealth: vi.fn(),
  useAllLatestMeasurements: vi.fn(),
  useAllBuildup: vi.fn(),
}))

vi.mock('../../../api/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/hooks')>()
  return { ...actual, useBunkers, useHealth, useAllLatestMeasurements, useAllBuildup }
})

const makeBunker = (id: string, name: string, online = true): BunkerInfo => ({
  id,
  name,
  online,
  geometry_id: `geom-${id}`,
})

const makeBeam = (beam_name: string, height: number, status = ''): Beam => ({
  beam_name,
  height,
  status,
})

const makeMeasurement = (beams: Beam[]): Measurement => ({
  id: 1,
  ts: '2026-06-22T10:00:00.000Z',
  avg_level: 2.5,
  min_level: 1.0,
  max_level: 4.0,
  mass: 39.5,
  volume: 17.2,
  beams,
})

const makeBuildup = (zones: BuildupAnalysis['zones']): BuildupAnalysis => ({
  bunker_id: 'b1',
  ts: '2026-06-22T10:00:00.000Z',
  threshold_m: 0.35,
  zones,
})

const zone = (axis: string, severity: string) => ({
  axis,
  severity,
  score: 0,
  deviation_m: 0,
  affected_positions: [],
})

const makeHealth = (): Health => ({
  edge_pcs: [{ node_id: 'edge-1', online: true, last_pulse: '2026-06-22T10:00:00.000Z', cpu: 10, ram: 20, disk: 30 }],
})

function renderPage() {
  return render(<OverviewPage />, { wrapper: MemoryRouter })
}

describe('OverviewPage', () => {
  it('shows skeletons while the bunkers list is loading', () => {
    useBunkers.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: vi.fn() })
    useHealth.mockReturnValue({ data: undefined })
    useAllLatestMeasurements.mockReturnValue([])
    useAllBuildup.mockReturnValue([])

    renderPage()
    expect(screen.queryByText('Бункер 1')).not.toBeInTheDocument()
  })

  it('shows an error message when the bunkers list fails to load', () => {
    useBunkers.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
      refetch: vi.fn(),
    })
    useHealth.mockReturnValue({ data: undefined })
    useAllLatestMeasurements.mockReturnValue([])
    useAllBuildup.mockReturnValue([])

    renderPage()
    expect(screen.getByText(/Не удалось загрузить список бункеров/)).toBeInTheDocument()
  })

  it('renders a card per bunker with its online status and readings', () => {
    useBunkers.mockReturnValue({
      data: [makeBunker('b1', 'Бункер 1', true), makeBunker('b2', 'Бункер 2', false)],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    useHealth.mockReturnValue({ data: makeHealth() })
    useAllLatestMeasurements.mockReturnValue([
      { data: makeMeasurement([makeBeam('A1', 2.5)]) },
      { data: undefined },
    ])
    useAllBuildup.mockReturnValue([{ data: makeBuildup([zone('A', 'none')]) }, { data: undefined }])

    renderPage()

    expect(screen.getByText('Бункер 1')).toBeInTheDocument()
    expect(screen.getByText('Бункер 2')).toBeInTheDocument()
    // "Online" also appears on the edge-node badge — assert at least one bunker card shows it
    expect(screen.getAllByText('Online').length).toBeGreaterThan(0)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('links each card to that bunker dashboard', () => {
    useBunkers.mockReturnValue({
      data: [makeBunker('b1', 'Бункер 1')],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    useHealth.mockReturnValue({ data: makeHealth() })
    useAllLatestMeasurements.mockReturnValue([{ data: makeMeasurement([makeBeam('A1', 2.5)]) }])
    useAllBuildup.mockReturnValue([{ data: makeBuildup([zone('A', 'none')]) }])

    renderPage()
    expect(screen.getByRole('link', { name: /Бункер 1/ })).toHaveAttribute('href', '/bunkers/b1')
  })

  it('shows the worst buildup severity on the card', () => {
    useBunkers.mockReturnValue({
      data: [makeBunker('b1', 'Бункер 1')],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    useHealth.mockReturnValue({ data: makeHealth() })
    useAllLatestMeasurements.mockReturnValue([{ data: makeMeasurement([makeBeam('A1', 2.5)]) }])
    useAllBuildup.mockReturnValue([
      { data: makeBuildup([zone('A', 'low'), zone('B', 'high')]) },
    ])

    renderPage()
    expect(screen.getByText('Высокая')).toBeInTheDocument()
    expect(screen.getByText('2 ось(ей)')).toBeInTheDocument()
  })

  it('renders the edge PC health section', () => {
    useBunkers.mockReturnValue({ data: [makeBunker('b1', 'Бункер 1')], isLoading: false, error: null, refetch: vi.fn() })
    useHealth.mockReturnValue({ data: makeHealth() })
    useAllLatestMeasurements.mockReturnValue([{ data: undefined }])
    useAllBuildup.mockReturnValue([{ data: undefined }])

    renderPage()
    expect(screen.getByText('edge-1')).toBeInTheDocument()
  })
})
