import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuildupPanel } from '../BuildupPanel'
import type { BuildupAnalysis, BuildupZone } from '../../../types'

const zone = (axis: string, severity: string, overrides: Partial<BuildupZone> = {}): BuildupZone => ({
  axis,
  severity,
  score: 0,
  deviation_m: 0,
  affected_positions: [],
  ...overrides,
})

const makeAnalysis = (zones: BuildupZone[]): BuildupAnalysis => ({
  bunker_id: 'bunker-1',
  ts: '2026-06-22T10:00:00.000Z',
  threshold_m: 0.35,
  zones,
})

describe('BuildupPanel', () => {
  it('shows a skeleton instead of the list while loading with no data yet', () => {
    render(<BuildupPanel analysis={undefined} isLoading={true} />)
    expect(screen.queryByText('Аномалий не обнаружено')).not.toBeInTheDocument()
  })

  it('shows "no anomalies" summary when every zone is severity none', () => {
    const analysis = makeAnalysis(['A', 'B'].map((a) => zone(a, 'none')))
    render(<BuildupPanel analysis={analysis} isLoading={false} />)
    expect(screen.getByText('Аномалий не обнаружено')).toBeInTheDocument()
  })

  it('counts and flags axes with non-none severity', () => {
    const analysis = makeAnalysis([zone('A', 'none'), zone('B', 'high'), zone('C', 'low')])
    render(<BuildupPanel analysis={analysis} isLoading={false} />)
    expect(screen.getByText('2 ось(ей) под подозрением')).toBeInTheDocument()
  })

  it('sorts zones worst-severity first', () => {
    const analysis = makeAnalysis([zone('A', 'low'), zone('B', 'high'), zone('C', 'none')])
    render(<BuildupPanel analysis={analysis} isLoading={false} />)
    const axisCells = screen.getAllByText(/^[A-H]$/)
    expect(axisCells.map((el) => el.textContent)).toEqual(['B', 'A', 'C'])
  })

  it('renders deviation and affected positions for a flagged zone', () => {
    const analysis = makeAnalysis([
      zone('B', 'high', { deviation_m: 0.512, affected_positions: [7, 8] }),
    ])
    render(<BuildupPanel analysis={analysis} isLoading={false} />)
    expect(screen.getByText('откл. +0.51 м')).toBeInTheDocument()
    expect(screen.getByText('поз. 7, 8')).toBeInTheDocument()
  })

  it('renders an unknown severity value gracefully instead of crashing', () => {
    const analysis = makeAnalysis([zone('A', 'future-flag')])
    render(<BuildupPanel analysis={analysis} isLoading={false} />)
    expect(screen.getByText('Неизв.: future-flag')).toBeInTheDocument()
  })

  it('notes that every beam except Disabled is included when that mode is on', () => {
    const analysis = makeAnalysis([zone('A', 'none')])
    render(<BuildupPanel analysis={analysis} isLoading={false} countsAllExceptDisabled />)
    expect(screen.getByText(/кроме статуса Disabled/)).toBeInTheDocument()
  })

  it('shows an empty message when there is no data at all', () => {
    render(<BuildupPanel analysis={undefined} isLoading={false} />)
    expect(screen.getByText('Нет данных для анализа')).toBeInTheDocument()
  })
})
