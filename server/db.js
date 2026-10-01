import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { ApiError, validateCase } from './validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultSeedFile = path.join(__dirname, 'data', 'seed.json')

export function atomicWrite(filePath, value) {
  const serialized = JSON.stringify(value, null, 2)
  if (Buffer.byteLength(serialized) > 32 * 1024 * 1024)
    throw new Error('Database exceeds the 32 MB file limit.')
  const temporary = filePath + '.' + randomUUID() + '.tmp'
  let descriptor
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600)
    fs.writeFileSync(descriptor, serialized)
    fs.fsyncSync(descriptor)
    fs.closeSync(descriptor)
    descriptor = undefined
    fs.renameSync(temporary, filePath)
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary)
  }
}

function validateState(value) {
  const collections = ['alerts', 'cases', 'evidence', 'auditEvents']
  if (
    !value ||
    typeof value !== 'object' ||
    !Number.isSafeInteger(value.meta?.sequence) ||
    value.meta.sequence < 0
  )
    throw new Error('Invalid database metadata. Restore from a verified backup.')
  for (const key of collections) {
    if (!Array.isArray(value[key]) || value[key].length > 100000)
      throw new Error('Invalid or oversized database collection: ' + key)
    const ids = new Set()
    for (const item of value[key]) {
      if (!item || typeof item.id !== 'string' || ids.has(item.id))
        throw new Error('Invalid or duplicate database ID in ' + key)
      ids.add(item.id)
    }
  }
  for (const alert of value.alerts) {
    if (
      !['new', 'acknowledged', 'triaging', 'contained', 'closed'].includes(alert.status) ||
      !['critical', 'high', 'medium', 'low'].includes(alert.severity) ||
      !Array.isArray(alert.evidenceIds) ||
      !Number.isFinite(Date.parse(alert.createdAt))
    )
      throw new Error('Invalid database alert.')
  }
  for (const record of value.cases) {
    validateCase(
      Object.fromEntries(
        [
          'title',
          'priority',
          'status',
          'location',
          'summary',
          'protocol',
          'leadAnalyst',
          'alertIds',
          'evidenceIds',
        ].map((key) => [key, record[key]]),
      ),
    )
    if (
      !Array.isArray(record.timeline) ||
      !Number.isFinite(Date.parse(record.openedAt)) ||
      !Number.isFinite(Date.parse(record.updatedAt))
    )
      throw new Error('Invalid database case.')
  }
  for (const evidence of value.evidence) {
    if (
      !evidence.metadata ||
      !Array.isArray(evidence.metadata.classes) ||
      !evidence.metadata.classes.every((item) => typeof item === 'string') ||
      typeof evidence.metadata.cameraId !== 'string' ||
      typeof evidence.metadata.zone !== 'string' ||
      !Number.isFinite(Date.parse(evidence.metadata.ts))
    )
      throw new Error('Invalid database evidence.')
  }
  for (const event of value.auditEvents) {
    if (
      !['alert', 'case', 'evidence', 'simulator'].includes(event.entityType) ||
      !['entityId', 'action', 'actor'].every((key) => typeof event[key] === 'string') ||
      !Number.isFinite(Date.parse(event.timestamp))
    )
      throw new Error('Invalid database audit event.')
  }
  return value
}

export function createDatabase({
  dbFile = path.join(__dirname, 'data', 'db.json'),
  seedFile = defaultSeedFile,
  write = atomicWrite,
} = {}) {
  const dataDir = path.dirname(dbFile)
  let state

  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function ensureDataFile() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    if (!fs.existsSync(dbFile)) {
      write(dbFile, validateState(readJson(seedFile)))
    }
  }

  function readJson(filePath) {
    if (fs.statSync(filePath).size > 32 * 1024 * 1024)
      throw new Error('Database exceeds the 32 MB file limit. Archive records before restarting.')
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }

  function getState() {
    if (!state) {
      ensureDataFile()
      state = validateState(readJson(dbFile))
    }

    return state
  }

  function persist() {
    write(dbFile, validateState(getState()))
  }

  function nextSequence() {
    const currentState = getState()
    if (currentState.meta.sequence >= Number.MAX_SAFE_INTEGER)
      throw new ApiError(503, 'Database sequence capacity reached.', 'CAPACITY_REACHED')
    currentState.meta.sequence += 1
    return currentState.meta.sequence
  }

  function nextId(prefix) {
    return `${prefix}-${nextSequence()}`
  }

  function paginate(items, page = 1, pageSize = 10) {
    const safePage = Number.isSafeInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1
    const safePageSize =
      Number.isSafeInteger(Number(pageSize)) && Number(pageSize) > 0
        ? Math.min(100, Number(pageSize))
        : 10
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
      alerts: currentState.alerts.filter(
        (item) => item.caseId === caseId || match.alertIds.includes(item.id),
      ),
      evidence: currentState.evidence.filter(
        (item) => item.relatedCaseId === caseId || match.evidenceIds.includes(item.id),
      ),
      audit: currentState.auditEvents.filter(
        (item) =>
          item.entityId === caseId ||
          currentState.alerts.some(
            (alert) => alert.caseId === caseId && alert.id === item.entityId,
          ),
      ),
    })
  }

  function initDb() {
    getState()
    return clone(state)
  }

  function listAlerts(params = {}) {
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

      return matchesStatus && matchesSeverity && matchesCamera && matchesRange && matchesQuery
    })

    return paginate(clone(filtered), params.page, params.pageSize)
  }

  function ackAlert(id, actor = 'local-operator') {
    const currentState = getState()
    const alert = currentState.alerts.find((item) => item.id === id)

    if (!alert) {
      return undefined
    }

    if (alert.status === 'acknowledged') return clone(alert)
    if (alert.status !== 'new')
      throw new ApiError(409, 'Only a new incident can be acknowledged.', 'INVALID_TRANSITION')
    const timestamp = new Date().toISOString()
    alert.status = 'acknowledged'
    alert.updatedAt = timestamp
    appendAudit('alert', alert.id, 'ALERT_ACKNOWLEDGED', actor, timestamp)
    persist()
    return clone(alert)
  }

  function getCaseById(id) {
    return hydrateCase(id)
  }

  function createCase(input, actor = 'local-operator') {
    const payload = validateCase(input)
    const currentState = getState()
    if (
      payload.alertIds.some((id) => !currentState.alerts.some((item) => item.id === id)) ||
      payload.evidenceIds.some((id) => !currentState.evidence.some((item) => item.id === id))
    )
      throw new ApiError(400, 'Linked alert or evidence does not exist.')
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
          detail: 'Case opened in the NOVA workspace.',
          operator: payload.leadAnalyst,
        },
      ],
      humanValidationRequired: true,
    }

    currentState.cases.unshift(created)
    appendAudit('case', created.id, 'CASE_CREATED', actor, timestamp)
    persist()
    return hydrateCase(created.id)
  }

  function searchRecords(params = {}) {
    const currentState = getState()
    const filteredEvidence = currentState.evidence.filter((item) => {
      const matchesCamera =
        !params.cameraId || params.cameraId === 'all' || item.metadata.cameraId === params.cameraId
      const matchesClass =
        !params.class || params.class === 'all' || item.metadata.classes.includes(params.class)
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

      return matchesCamera && matchesSeverity && matchesStatus && matchesRange && matchesQuery
    })

    const caseIds = new Set([
      ...filteredEvidence.map((item) => item.relatedCaseId),
      ...filteredAlerts.map((item) => item.caseId),
    ])

    const hasRecordFilters = [params.cameraId, params.class, params.severity, params.status].some(
      (value) => value && value !== 'all',
    )
    const filteredCases = currentState.cases.filter(
      (item) =>
        caseIds.has(item.id) ||
        (!hasRecordFilters &&
          inDateRange(item.openedAt, params.from, params.to) &&
          matchesText(
            [item.id, item.title, item.summary, item.location, item.leadAnalyst],
            params.q,
          )),
    )
    filteredCases.forEach((item) => caseIds.add(item.id))
    const filteredAudit = currentState.auditEvents.filter(
      (item) =>
        caseIds.has(item.entityId) || filteredAlerts.some((alert) => alert.id === item.entityId),
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

  function listAuditEvents(params = {}) {
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

  function ingestSimulatedAlert(template) {
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

  function transaction(action) {
    return (...args) => {
      const previous = clone(getState())
      try {
        return action(...args)
      } catch (error) {
        state = previous
        if (error instanceof ApiError) throw error
        throw new ApiError(
          503,
          'The change could not be saved. Please try again.',
          'STORAGE_UNAVAILABLE',
        )
      }
    }
  }
  return {
    initDb,
    listAlerts,
    getCaseById,
    searchRecords,
    listAuditEvents,
    ackAlert: transaction(ackAlert),
    createCase: transaction(createCase),
    ingestSimulatedAlert: transaction(ingestSimulatedAlert),
  }
}

const database = createDatabase()
export const {
  initDb,
  listAlerts,
  getCaseById,
  searchRecords,
  listAuditEvents,
  ackAlert,
  createCase,
  ingestSimulatedAlert,
} = database
