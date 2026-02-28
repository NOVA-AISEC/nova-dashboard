import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const dbFile = path.join(dataDir, 'db.json')
const seedFile = path.join(dataDir, 'seed.json')

let state

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(dbFile)) {
    fs.copyFileSync(seedFile, dbFile)
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function getState() {
  if (!state) {
    ensureDataFile()
    state = readJson(dbFile)
    state.meta ??= { sequence: 1000 }
  }

  return state
}

function persist() {
  writeJson(dbFile, getState())
}

function nextSequence() {
  const currentState = getState()
  currentState.meta.sequence += 1
  return currentState.meta.sequence
}

function nextId(prefix) {
  return `${prefix}-${nextSequence()}`
}

function paginate(items, page = 1, pageSize = 10) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 10)
  const start = (safePage - 1) * safePageSize

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
  }
}

function matchesText(parts, query) {
  if (!query || !String(query).trim()) {
    return true
  }

  return parts.join(' ').toLowerCase().includes(String(query).trim().toLowerCase())
}

function inDateRange(value, from, to) {
  const ts = new Date(value).getTime()

  if (from && ts < new Date(from).getTime()) {
    return false
  }

  if (to && ts > new Date(to).getTime()) {
    return false
  }

  return true
}

function appendAudit(entityType, entityId, action, actor, timestamp, metadata) {
  const currentState = getState()

  currentState.auditEvents.unshift({
    id: nextId('audit'),
    entityType,
    entityId,
    action,
    actor,
    timestamp,
    metadata,
  })
}

function hydrateCase(caseId) {
  const currentState = getState()
  const match = currentState.cases.find((item) => item.id === caseId)

  if (!match) {
    return undefined
  }

  return clone({
    ...match,
    alerts: currentState.alerts.filter((item) => item.caseId === caseId),
    evidence: currentState.evidence.filter((item) => item.relatedCaseId === caseId),
    audit: currentState.auditEvents.filter(
      (item) =>
        item.entityId === caseId ||
        currentState.alerts.some(
          (alert) => alert.caseId === caseId && alert.id === item.entityId,
        ),
    ),
  })
}

export function initDb() {
  getState()
  return clone(state)
}

export function listAlerts(params = {}) {
  const currentState = getState()
  const filtered = currentState.alerts.filter((alert) => {
    const matchesStatus =
      !params.status || params.status === 'all' || alert.status === params.status
    const matchesSeverity =
      !params.severity || params.severity === 'all' || alert.severity === params.severity
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || alert.cameraId === params.cameraId
    const matchesRange = inDateRange(alert.createdAt, params.from, params.to)
    const matchesQuery = matchesText(
      [alert.id, alert.title, alert.summary, alert.rule, alert.zone, alert.cameraId],
      params.q,
    )

    return (
      matchesStatus &&
      matchesSeverity &&
      matchesCamera &&
      matchesRange &&
      matchesQuery
    )
  })

  return paginate(clone(filtered), params.page, params.pageSize)
}

export function ackAlert(id) {
  const currentState = getState()
  const alert = currentState.alerts.find((item) => item.id === id)

  if (!alert) {
    return undefined
  }

  const timestamp = new Date().toISOString()
  alert.status = 'acknowledged'
  alert.updatedAt = timestamp
  appendAudit('alert', alert.id, 'ALERT_ACKNOWLEDGED', 'local-operator', timestamp)
  persist()
  return clone(alert)
}

export function getCaseById(id) {
  return hydrateCase(id)
}

export function createCase(payload) {
  const currentState = getState()
  const timestamp = new Date().toISOString()
  const created = {
    id: nextId('case'),
    title: payload.title,
    priority: payload.priority,
    status: payload.status,
    location: payload.location,
    openedAt: timestamp,
    updatedAt: timestamp,
    leadAnalyst: payload.leadAnalyst,
    summary: payload.summary,
    protocol: payload.protocol,
    alertIds: payload.alertIds ?? [],
    evidenceIds: payload.evidenceIds ?? [],
    timeline: [
      {
        id: nextId('timeline'),
        kind: 'note',
        timestamp,
        title: 'Case created',
        detail: 'Case opened in the local DAMA LTD simulator.',
        operator: payload.leadAnalyst,
      },
    ],
    humanValidationRequired: true,
  }

  currentState.cases.unshift(created)
  appendAudit('case', created.id, 'CASE_CREATED', payload.leadAnalyst, timestamp)
  persist()
  return hydrateCase(created.id)
}

export function searchRecords(params = {}) {
  const currentState = getState()
  const filteredEvidence = currentState.evidence.filter((item) => {
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || item.metadata.cameraId === params.cameraId
    const matchesClass =
      !params.class ||
      params.class === 'all' ||
      item.metadata.classes.includes(params.class)
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

  const filteredAlerts = currentState.alerts.filter((item) => {
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || item.cameraId === params.cameraId
    const matchesSeverity =
      !params.severity || params.severity === 'all' || item.severity === params.severity
    const matchesStatus =
      !params.status || params.status === 'all' || item.status === params.status
    const matchesRange = inDateRange(item.createdAt, params.from, params.to)
    const matchesQuery = matchesText(
      [item.id, item.title, item.summary, item.rule, item.zone, item.cameraId],
      params.q,
    )

    return (
      matchesCamera &&
      matchesSeverity &&
      matchesStatus &&
      matchesRange &&
      matchesQuery
    )
  })

  const caseIds = new Set([
    ...filteredEvidence.map((item) => item.relatedCaseId),
    ...filteredAlerts.map((item) => item.caseId),
  ])

  const filteredCases = currentState.cases.filter((item) => caseIds.has(item.id))
  const filteredAudit = currentState.auditEvents.filter(
    (item) =>
      caseIds.has(item.entityId) ||
      filteredAlerts.some((alert) => alert.id === item.entityId),
  )

  return clone({
    alerts: filteredAlerts,
    cases: filteredCases,
    evidence: filteredEvidence,
    audit: filteredAudit,
    cameras: Array.from(
      new Set(currentState.evidence.map((item) => item.metadata.cameraId)),
    ).sort(),
    zones: Array.from(new Set(currentState.evidence.map((item) => item.metadata.zone))).sort(),
  })
}

export function listAuditEvents(params = {}) {
  const currentState = getState()
  const filtered = currentState.auditEvents.filter((event) => {
    const matchesType =
      !params.entityType || params.entityType === 'all' || event.entityType === params.entityType
    const matchesId =
      !params.entityId || params.entityId === 'all' || event.entityId === params.entityId

    return matchesType && matchesId
  })

  return paginate(clone(filtered), params.page, params.pageSize)
}

export function ingestSimulatedAlert(template) {
  const currentState = getState()
  const timestamp = new Date().toISOString()
  const evidenceId = nextId('ev')
  const alertId = nextId('alt')

  const evidenceRecord = {
    id: evidenceId,
    title: template.evidence.title,
    summary: template.evidence.summary,
    snapshotUrl: template.evidence.snapshotUrl,
    metadata: {
      ...template.evidence.metadata,
      ts: timestamp,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: (template.evidence.detections ?? []).map((detection, index) => ({
      id: `${evidenceId}-det-${index + 1}`,
      ...detection,
    })),
    retention: template.evidence.retention,
    chainOfCustody: template.evidence.chainOfCustody,
    redactions: template.evidence.redactions,
    analyticsSummary: template.evidence.analyticsSummary,
    relatedCaseId: template.caseId,
  }

  const alertRecord = {
    id: alertId,
    title: template.title,
    severity: template.severity,
    status: 'new',
    zone: template.zone,
    cameraId: template.cameraId,
    createdAt: timestamp,
    updatedAt: timestamp,
    assignee: template.assignee,
    rule: template.rule,
    summary: template.summary,
    caseId: template.caseId,
    evidenceIds: [evidenceId],
    requiresHumanValidation: true,
  }

  currentState.evidence.unshift(evidenceRecord)
  currentState.alerts.unshift(alertRecord)

  const linkedCase = currentState.cases.find((item) => item.id === template.caseId)
  if (linkedCase) {
    linkedCase.updatedAt = timestamp
    linkedCase.alertIds = Array.from(new Set([alertId, ...linkedCase.alertIds]))
    linkedCase.evidenceIds = Array.from(new Set([evidenceId, ...linkedCase.evidenceIds]))
    linkedCase.timeline.unshift({
      id: nextId('timeline'),
      kind: 'alert',
      timestamp,
      title: template.title,
      detail: `${template.rule}. Human validation pending.`,
      operator: 'DAMA LTD Simulator',
    })
  }

  appendAudit('alert', alertId, 'ALERT_INGESTED', 'simulator', timestamp, {
    cameraId: template.cameraId,
    zone: template.zone,
  })

  persist()
  return clone(alertRecord)
}
