import { API_BASE_URL } from '../config'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} — ${url}`)
  }
  return res.json() as Promise<T>
}
