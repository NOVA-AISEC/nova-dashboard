import { cases, auditEvents } from '@/data/campus-cases-audit'
import {
  complianceNotices,
  campusAlertCategories,
  campusContextAreas,
  campusEvents,
  campusUsers,
  campusZones,
  bottleneckSolutions,
  evidenceExports,
  trafficAdvisories,
  vehicleSightings,
} from '@/data/campus-reference-data'
import { alerts, evidence } from '@/data/campus-evidence-alerts'
import type { Case, CreateCasePayload, OpsMetric, SearchParams, SearchResults } from '@/types/domain'

export {
  alerts,
  auditEvents,
  campusAlertCategories,
  campusContextAreas,
  campusEvents,
  campusUsers,
  campusZones,
  bottleneckSolutions,
  cases,
  complianceNotices,
  evidence,
  evidenceExports,
  trafficAdvisories,
  vehicleSightings,
}

export function getComplianceNotices() {
  return complianceNotices
}

export function getAlertMetrics(): OpsMetric[] {
  const activeAlerts = alerts.filter((alert) => alert.status !== 'closed')
  const escalatedCases = cases.filter((caseItem) => caseItem.status === 'escalated').length

  return [
    {
      label: 'Open triage queue',
      value: String(activeAlerts.length).padStart(2, '0'),
      delta: `${activeAlerts.filter((alert) => alert.severity === 'critical').length} critical`,
      tone: 'accent',
    },
    {
      label: 'Evidence packs',
      value: String(evidenceExports.length).padStart(2, '0'),
      delta: 'Snapshots + metadata only',
      tone: 'success',
    },
    {
      label: 'Escalated cases',
      value: String(escalatedCases).padStart(2, '0'),
      delta: 'Human validation required',
      tone: 'warning',
    },
    {
      label: 'Biometric actions',
      value: '00',
      delta: 'Disabled by policy',
      tone: 'ink',
    },
  ]
}

export function findCaseById(caseId: string) {
  return cases.find((item) => item.id === caseId)
}

export function hydrateCase(caseId: string) {
  const match = findCaseById(caseId)

  if (!match) {
    return undefined
  }

  return {
    ...match,
    alerts: alerts.filter((item) => item.caseId === caseId),
    evidence: evidence.filter((item) => item.relatedCaseId === caseId),
    audit: auditEvents.filter(
      (item) =>
        item.entityId === caseId ||
        alerts.some((alert) => alert.caseId === caseId && alert.id === item.entityId),
    ),
  }
}

export function createCaseRecord(payload: CreateCasePayload) {
  const now = new Date().toISOString()
  const nextCase: Case = {
    id: `case-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    priority: payload.priority,
    status: payload.status,
    location: payload.location,
    openedAt: now,
    updatedAt: now,
    leadAnalyst: payload.leadAnalyst,
    summary: payload.summary,
    protocol: payload.protocol,
    alertIds: payload.alertIds ?? [],
    evidenceIds: payload.evidenceIds ?? [],
    timeline: [
      {
        id: `timeline-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'note',
        timestamp: now,
        title: 'Case created',
        detail: 'Case opened in local campus mock mode.',
        operator: payload.leadAnalyst,
      },
    ],
    humanValidationRequired: true,
  }

  cases.unshift(nextCase)
  auditEvents.unshift({
    id: `audit-${Math.random().toString(36).slice(2, 8)}`,
    entityType: 'case',
    entityId: nextCase.id,
    action: 'CASE_CREATED',
    actor: payload.leadAnalyst,
    timestamp: now,
  })

  return nextCase
}

export function updateAlertAck(id: string) {
  const alert = alerts.find((item) => item.id === id)

  if (!alert) {
    return undefined
  }

  alert.status = 'acknowledged'
  alert.updatedAt = new Date().toISOString()
  auditEvents.unshift({
    id: `audit-${Math.random().toString(36).slice(2, 8)}`,
    entityType: 'alert',
    entityId: alert.id,
    action: 'ALERT_ACKNOWLEDGED',
    actor: 'incident-desk',
    timestamp: alert.updatedAt,
  })

  return alert
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort()
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

function matchesText(parts: string[], query?: string) {
  if (!query?.trim()) {
    return true
  }

  return parts.join(' ').toLowerCase().includes(query.trim().toLowerCase())
}

export function searchDataset(params: SearchParams = {}): SearchResults {
  const filteredEvidence = evidence.filter((item) => {
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || item.metadata.cameraId === params.cameraId
    const matchesClass =
      !params.class ||
      params.class === 'all' ||
      item.metadata.classes.some((entry) => entry === params.class)
    const matchesRange = inDateRange(item.metadata.ts, params.from, params.to)
    const matchesQuery = matchesText(
      [
        item.id,
        item.title,
        item.summary,
        item.metadata.zone,
        item.metadata.cameraId,
        item.analyticsSummary,
        item.metadata.classes.join(' '),
      ],
      params.q,
    )

    return matchesCamera && matchesClass && matchesRange && matchesQuery
  })

  const filteredAlerts = alerts.filter((item) => {
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || item.cameraId === params.cameraId
    const matchesSeverity =
      !params.severity || params.severity === 'all' || item.severity === params.severity
    const matchesStatus =
      !params.status || params.status === 'all' || item.status === params.status
    const matchesRange = inDateRange(item.createdAt, params.from, params.to)
    const matchesQuery = matchesText(
      [item.id, item.title, item.summary, item.rule, item.zone, item.cameraId, item.category],
      params.q,
    )

    return matchesCamera && matchesSeverity && matchesStatus && matchesRange && matchesQuery
  })

  const caseIds = new Set([
    ...filteredEvidence.map((item) => item.relatedCaseId),
    ...filteredAlerts.map((item) => item.caseId),
  ])

  const filteredCases = cases.filter((item) => caseIds.has(item.id))
  const filteredAudit = auditEvents.filter(
    (item) =>
      caseIds.has(item.entityId) ||
      filteredAlerts.some((alert) => alert.id === item.entityId),
  )

  return {
    alerts: filteredAlerts,
    cases: filteredCases,
    evidence: filteredEvidence,
    audit: filteredAudit,
    cameras: unique(evidence.map((item) => item.metadata.cameraId)),
    zones: unique(evidence.map((item) => item.metadata.zone)),
  }
}
