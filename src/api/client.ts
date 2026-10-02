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
import type { EngineRun, Mission, SecurityState } from '../../shared/security-engine'
import type {
  IntelligenceGraph,
  IntelligenceQuery,
  IntelligenceAnswer,
} from '../../shared/intelligence-engine'

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

export function getSecurityState() {
  return request<SecurityState>('/api/security')
}
export function getIntelligence() {
  return request<IntelligenceGraph>('/api/intelligence')
}
export function askIntelligence(payload: IntelligenceQuery) {
  return request<IntelligenceAnswer>('/api/intelligence/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export function runAssessment(payload: { incidentId: string; intent: string }) {
  return request<EngineRun>('/api/security/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export function proposeMission(runId: string) {
  return request<Mission>('/api/security/missions', {
    method: 'POST',
    body: JSON.stringify({ runId }),
  })
}
export function decideMission(
  id: string,
  decision: string,
  note: string,
  expectedRevision: number,
) {
  return request<Mission>(`/api/security/missions/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, note, expectedRevision }),
  })
}
export function completeMissionStep(
  id: string,
  stepId: string,
  note: string,
  expectedRevision: number,
) {
  return request<Mission>(
    `/api/security/missions/${encodeURIComponent(id)}/steps/${encodeURIComponent(stepId)}`,
    { method: 'POST', body: JSON.stringify({ note, expectedRevision }) },
  )
}
export function coordinateMission(
  id: string,
  action: string,
  note: string,
  expectedRevision: number,
  team?: string,
) {
  return request<Mission>(`/api/security/missions/${encodeURIComponent(id)}/coordination`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      note,
      expectedRevision,
      ...(team !== undefined ? { team } : {}),
    }),
  })
}
