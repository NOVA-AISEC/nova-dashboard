export const SESSION_EXPIRED = 'nova.session-expired'
let csrfToken = ''
export function setCsrfToken(value: string) {
  csrfToken = value
}

export class HttpError extends Error {
  readonly status: number
  readonly code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  notifyExpiry = true,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 12_000)
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body) headers.set('Content-Type', 'application/json')
  if (init?.method && !['GET', 'HEAD'].includes(init.method)) headers.set('X-Nova-CSRF', csrfToken)
  try {
    const response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers,
      signal: controller.signal,
    })
    if (response.status === 204) return undefined as T
    const isJson = response.headers.get('Content-Type')?.includes('application/json')
    const payload: unknown = isJson ? await response.json().catch(() => null) : null
    if (!response.ok) {
      if (response.status === 401 && notifyExpiry) window.dispatchEvent(new Event(SESSION_EXPIRED))
      const error =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
      const message =
        typeof error.message === 'string' && error.message.length <= 500
          ? error.message
          : `Request failed (${response.status}). Please try again.`
      throw new HttpError(
        message,
        response.status,
        typeof error.code === 'string' ? error.code : undefined,
      )
    }
    if (payload === null)
      throw new Error(
        'The API returned an unexpected response. Please check the server and try again.',
      )
    return payload as T
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('The request timed out. Check your connection and try again.')
    if (error instanceof TypeError)
      throw new Error('Unable to reach the API. Check your connection and try again.')
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
