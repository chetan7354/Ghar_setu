import type { ApiErrorBody } from './types'

const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/v1'
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
const TOKEN_KEY = 'gs_token'

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(t: string | null) {
    try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
  },
}

type Query = Record<string, string | number | boolean | undefined | null>

export function qs(params: Query = {}): string {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) u.set(k, String(v))
  })
  const s = u.toString()
  return s ? `?${s}` : ''
}

export async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  if (IS_DEMO) {
    const demo = await import('./demo')
    return demo.handle<T>(method, path, body, query)
  }
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload: BodyInit | undefined
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let res: Response
  try {
    res = await fetch(BASE + path + qs(query), { method, headers, body: payload })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiErrorBody>
    if (res.status === 401 && token) tokenStore.set(null)
    const fields: Record<string, string> = {}
    err.fieldErrors?.forEach(f => { fields[f.field] = f.message })
    throw new ApiError(res.status, err.message ?? 'Something went wrong', fields)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
}
