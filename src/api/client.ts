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

import { request } from '@/api/transport'

function withQuery<T extends object>(path: string, params?: T) {
  const searchParams = new URLSearchParams()

  Object.entries((params ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
    if ((typeof value === 'string' || typeof value === 'number') && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function listAlerts(params: ListAlertsParams = {}) {
  return request<Paginated<Alert>>(withQuery('/api/alerts', params))
}

export function getCase(id: string) {
  return request<Case>(`/api/cases/${encodeURIComponent(id)}`)
}

export function createCase(payload: CreateCasePayload) {
  return request<Case>('/api/cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function ackAlert(id: string) {
  return request<Alert>(`/api/alerts/${encodeURIComponent(id)}/ack`, {
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

export function listAudit(
  params: {
    entityType?: string
    entityId?: string
    page?: number
    pageSize?: number
  } = {},
) {
  return request<Paginated<AuditEvent>>(withQuery('/api/audit', params))
}
