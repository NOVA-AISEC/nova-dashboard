export interface IncidentReportRecord {
  id: string
  reporter: string
  category: string
  zone: string
  priority: string
  summary: string
  createdAt: string
}

export interface OperatorPreferences {
  defaultZone: string
  autoPrintShiftBrief: boolean
  compactTables: boolean
}

const shiftNotesKey = 'dama-sentinel.shift-notes'
const incidentReportsKey = 'dama-sentinel.incident-reports'
const preferencesKey = 'dama-sentinel.preferences'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function readShiftNotes() {
  return readJson(shiftNotesKey, '')
}

export function writeShiftNotes(value: string) {
  writeJson(shiftNotesKey, value)
}

export function readIncidentReports() {
  return readJson<IncidentReportRecord[]>(incidentReportsKey, [])
}

export function writeIncidentReports(value: IncidentReportRecord[]) {
  writeJson(incidentReportsKey, value)
}

export function readOperatorPreferences() {
  return readJson<OperatorPreferences>(preferencesKey, {
    defaultZone: 'Main Gate  Lane 1',
    autoPrintShiftBrief: false,
    compactTables: true,
  })
}

export function writeOperatorPreferences(value: OperatorPreferences) {
  writeJson(preferencesKey, value)
}
