export class ApiError extends Error {
  constructor(status, message, code = 'INVALID_REQUEST') {
    super(message)
    this.status = status
    this.code = code
  }
}

export const roles = ['guard', 'analyst', 'supervisor', 'admin']
export const alertStatuses = ['new', 'acknowledged', 'triaging', 'contained', 'closed']
export const severities = ['critical', 'high', 'medium', 'low']
export const casePriorities = ['priority-1', 'priority-2', 'priority-3']
export const caseStatuses = ['active', 'monitoring', 'escalated', 'closed']

export function text(value, field, max = 200, optional = false) {
  if (optional && value === undefined) return undefined
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim().length > max ||
    [...value].some(
      (character) => character.charCodeAt(0) < 32 && ![9, 10, 13].includes(character.charCodeAt(0)),
    )
  ) {
    throw new ApiError(400, `${field} must be text between 1 and ${max} characters.`)
  }
  return value.trim()
}

function choice(value, field, choices, optional = false) {
  if (optional && value === undefined) return undefined
  if (!choices.includes(value)) throw new ApiError(400, `Invalid ${field}.`)
  return value
}

export function identifier(value, field = 'id') {
  const normalized = text(value, field, 100)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(normalized)) throw new ApiError(400, `Invalid ${field}.`)
  return normalized
}

function ids(value, field) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 100)
    throw new ApiError(400, `${field} must contain at most 100 IDs.`)
  return [...new Set(value.map((id) => identifier(id, field)))]
}

export function validateCase(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new ApiError(400, 'A case object is required.')
  const allowed = [
    'title',
    'priority',
    'status',
    'location',
    'summary',
    'protocol',
    'leadAnalyst',
    'alertIds',
    'evidenceIds',
  ]
  if (Object.keys(payload).some((key) => !allowed.includes(key)))
    throw new ApiError(400, 'Unknown case field.')
  return {
    title: text(payload.title, 'title', 200),
    priority: choice(payload.priority, 'priority', casePriorities),
    status: choice(payload.status, 'status', caseStatuses),
    location: text(payload.location, 'location', 200),
    summary: text(payload.summary, 'summary', 5000),
    protocol: text(payload.protocol, 'protocol', 2000),
    leadAnalyst: text(payload.leadAnalyst, 'leadAnalyst', 200),
    alertIds: ids(payload.alertIds, 'alertIds'),
    evidenceIds: ids(payload.evidenceIds, 'evidenceIds'),
  }
}

export function validateQuery(query, kind) {
  const allowed =
    kind === 'audit'
      ? ['entityType', 'entityId', 'page', 'pageSize']
      : [
          'q',
          'cameraId',
          'from',
          'to',
          'status',
          'severity',
          ...(kind === 'alerts' ? ['page', 'pageSize'] : ['class']),
        ]
  if (Object.keys(query).some((key) => !allowed.includes(key)))
    throw new ApiError(400, 'Unknown query parameter.')
  const result = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value !== 'string') throw new ApiError(400, `${key} must have one value.`)
    if (key === 'page' || key === 'pageSize') {
      const max = key === 'pageSize' ? 100 : 1000000
      if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max)
        throw new ApiError(400, `${key} must be an integer between 1 and ${max}.`)
      result[key] = Number(value)
    } else if (key === 'status') result[key] = choice(value, key, [...alertStatuses, 'all'])
    else if (key === 'severity') result[key] = choice(value, key, [...severities, 'all'])
    else if (key === 'entityType')
      result[key] = choice(value, key, ['alert', 'case', 'evidence', 'simulator', 'all'])
    else if (key === 'from' || key === 'to') {
      if (
        !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !==
          value.slice(0, 10)
      )
        throw new ApiError(400, `${key} must be an ISO date or timestamp.`)
      result[key] = value
    } else if (value !== '') result[key] = text(value, key, key === 'q' ? 300 : 100)
  }
  if (result.from && result.to && Date.parse(result.from) > Date.parse(result.to))
    throw new ApiError(400, 'from must be before to.')
  return result
}

export function boundedInteger(value, fallback, min, max, label) {
  const number = value === undefined ? fallback : Number(value)
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new Error(`${label} must be an integer between ${min} and ${max}.`)
  return number
}
