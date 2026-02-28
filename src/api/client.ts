import type {
  Alert,
  AuditEvent,
  Case,
  CreateCasePayload,
  ListAlertsParams,
  Paginated,
  SearchParams,
  SearchResults,
} from '@/types/domain'

const API_TIMEOUT_MS = 12_000

function withQuery<T extends object>(path: string, params?: T) {
  const searchParams = new URLSearchParams()

  Object.entries((params ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
    if (
      (typeof value === 'string' || typeof value === 'number') &&
      value !== ''
    ) {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed with ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function listAlerts(params: ListAlertsParams = {}) {
  return request<Paginated<Alert>>(withQuery('/api/alerts', params))
}

export function getCase(id: string) {
  return request<Case>(`/api/cases/${id}`)
}

export function createCase(payload: CreateCasePayload) {
  return request<Case>('/api/cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function ackAlert(id: string) {
  return request<Alert>(`/api/alerts/${id}/ack`, {
    method: 'POST',
  })
}

export function search(query: string, filters: Omit<SearchParams, 'q'> = {}) {
  return request<SearchResults>(
    withQuery('/api/search', {
      q: query,
      ...filters,
    }),
  )
}

export function listAudit(params: {
  entityType?: string
  entityId?: string
  page?: number
  pageSize?: number
} = {}) {
  return request<Paginated<AuditEvent>>(withQuery('/api/audit', params))
}
