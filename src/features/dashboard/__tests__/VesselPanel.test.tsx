import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VesselPanel } from '../VesselPanel'
import type { Beam, Measurement } from '../../../types'

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

describe('VesselPanel', () => {
  it('shows skeletons instead of values while loading with no measurement yet', () => {
    render(
      <VesselPanel measurement={undefined} bunkerName="Бункер 1" online={true} isLoading={true} />,
    )
    expect(screen.queryByText('Средний уровень')).not.toBeInTheDocument()
  })

  it('renders the bunker name and Online badge when online', () => {
    const measurement = makeMeasurement([makeBeam('A1', 2.5)])
    render(
      <VesselPanel measurement={measurement} bunkerName="Бункер 1" online={true} isLoading={false} />,
    )
    expect(screen.getByText('Бункер 1')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('renders Offline badge when not online', () => {
    const measurement = makeMeasurement([makeBeam('A1', 2.5)])
    render(
      <VesselPanel measurement={measurement} bunkerName="Бункер 1" online={false} isLoading={false} />,
    )
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('derives min/max level only from reliable beams with height > 0', () => {
    const measurement = makeMeasurement([
      makeBeam('A1', 5.0, 'Disabled'), // unreliable, excluded
      makeBeam('A2', 0, ''), // height 0, excluded
      makeBeam('A3', 1.5, ''),
      makeBeam('A4', 3.0, ''),
    ])
    render(
      <VesselPanel measurement={measurement} bunkerName="Бункер 1" online={true} isLoading={false} />,
    )
    expect(screen.getByText('1.50 м')).toBeInTheDocument()
    expect(screen.getByText('3.00 м')).toBeInTheDocument()
  })

  it('shows — for min/max level when no reliable beams have height > 0', () => {
    const measurement = makeMeasurement([makeBeam('A1', 0, ''), makeBeam('A2', 5.0, 'Disabled')])
    render(
      <VesselPanel measurement={measurement} bunkerName="Бункер 1" online={true} isLoading={false} />,
    )
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('formats average level, volume, and mass with their units', () => {
    // Two distinct beam heights so avg/min/max render as separate text nodes
    const measurement = makeMeasurement([makeBeam('A1', 1.5), makeBeam('A2', 3.5)])
    render(
      <VesselPanel measurement={measurement} bunkerName="Бункер 1" online={true} isLoading={false} />,
    )
    expect(screen.getByText('2.50 м')).toBeInTheDocument() // avg_level from measurement fixture
    expect(screen.getByText('17.20 м³')).toBeInTheDocument()
    expect(screen.getByText('39.500 т')).toBeInTheDocument()
  })
})
