import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_REQUEST_BASE_URL } from '../../config'
import { apiFetch } from '../client'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch', () => {
  it('appends resource paths to the versioned API base URL once', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([{ id: 'bunker-1' }]), { status: 200 }))

    await apiFetch('/bunkers')

    expect(fetchMock).toHaveBeenCalledWith(`${API_REQUEST_BASE_URL}/bunkers`, undefined)
    expect(`${API_REQUEST_BASE_URL}/bunkers`).not.toContain('/api/v1/api/v1/')
  })

  it('uses the backend error field as the ApiError message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Bunker not found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = apiFetch('/bunkers/missing')

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Bunker not found',
    })
  })

  it('falls back to the HTTP status for non-JSON errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' }),
    )

    await expect(apiFetch('/bunkers')).rejects.toThrow('503 Service Unavailable')
  })
})
