import { API_REQUEST_BASE_URL } from '../config'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorResponse {
  error?: unknown
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_REQUEST_BASE_URL}${path}`
  const res = await fetch(url, options)
  if (!res.ok) {
    let backendMessage: string | undefined
    try {
      const body = (await res.json()) as ErrorResponse
      if (typeof body.error === 'string' && body.error.trim()) {
        backendMessage = body.error
      }
    } catch {
      // Non-JSON errors still get a useful status-based message.
    }
    throw new ApiError(
      res.status,
      backendMessage ?? `${res.status} ${res.statusText || 'Request failed'}`,
    )
  }
  return res.json() as Promise<T>
}
