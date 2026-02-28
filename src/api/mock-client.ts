import {
  alerts,
  auditEvents,
  cases,
  createCaseRecord,
  evidence,
  findCaseById,
  getAlertMetrics,
  getComplianceNotices,
  hydrateCase,
  searchDataset,
  updateAlertAck,
} from '@/data/mock-data'
import type {
  CreateCasePayload,
  ListAlertsParams,
  Paginated,
  SearchParams,
} from '@/types/domain'

function includesText(haystack: string, query?: string) {
  return !query || haystack.toLowerCase().includes(query.trim().toLowerCase())
}

function inDateRange(value: string, from?: string, to?: string) {
  const ts = new Date(value).getTime()

  if (from && ts < new Date(from).getTime()) {
    return false
  }

  if (to && ts > new Date(to).getTime()) {
    return false
  }

  return true
}

function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safePageSize

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
  }
}

export async function listAlerts(params: ListAlertsParams = {}) {
  const filtered = alerts.filter((alert) => {
    const matchesStatus =
      !params.status || params.status === 'all' || alert.status === params.status
    const matchesSeverity =
      !params.severity || params.severity === 'all' || alert.severity === params.severity
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || alert.cameraId === params.cameraId
    const matchesRange = inDateRange(alert.createdAt, params.from, params.to)
    const haystack = [
      alert.id,
      alert.title,
      alert.zone,
      alert.summary,
      alert.rule,
      alert.cameraId,
    ].join(' ')
    const matchesQuery = includesText(haystack, params.q)

    return (
      matchesStatus &&
      matchesSeverity &&
      matchesCamera &&
      matchesRange &&
      matchesQuery
    )
  })

  return paginate(filtered, params.page, params.pageSize)
}

export async function getCase(id: string) {
  const match = hydrateCase(id) ?? findCaseById(id)

  if (!match) {
    throw new Error('Case not found')
  }

  return match
}

export async function createCase(payload: CreateCasePayload) {
  return createCaseRecord(payload)
}

export async function ackAlert(id: string) {
  const alert = updateAlertAck(id)

  if (!alert) {
    throw new Error('Alert not found')
  }

  return alert
}

export async function search(query: string, filters: Omit<SearchParams, 'q'> = {}) {
  return searchDataset({
    q: query,
    ...filters,
  })
}

export async function listAudit(params: {
  entityType?: string
  entityId?: string
  page?: number
  pageSize?: number
} = {}) {
  const filtered = auditEvents.filter((event) => {
    const matchesType =
      !params.entityType || params.entityType === 'all' || event.entityType === params.entityType
    const matchesId =
      !params.entityId || params.entityId === 'all' || event.entityId === params.entityId

    return matchesType && matchesId
  })

  return paginate(filtered, params.page, params.pageSize)
}

export { alerts, auditEvents, cases, evidence, getAlertMetrics, getComplianceNotices }
