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

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
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
  const notes = readJson<unknown>(shiftNotesKey, '')
  return typeof notes === 'string' ? notes : ''
}

export function writeShiftNotes(value: string) {
  writeJson(shiftNotesKey, value)
}

export function readIncidentReports() {
  const records = readJson<unknown>(incidentReportsKey, [])
  return Array.isArray(records)
    ? records.filter(
        (record): record is IncidentReportRecord =>
          record &&
          ['id', 'reporter', 'category', 'zone', 'priority', 'summary', 'createdAt'].every(
            (key) => typeof record[key] === 'string',
          ),
      )
    : []
}

export function writeIncidentReports(value: IncidentReportRecord[]) {
  writeJson(incidentReportsKey, value)
}

export function readOperatorPreferences() {
  const defaults: OperatorPreferences = {
    defaultZone: 'Main Gate  Lane 1',
    autoPrintShiftBrief: false,
    compactTables: true,
  }
  const saved = readJson<Partial<OperatorPreferences> | null>(preferencesKey, null)
  return {
    defaultZone: typeof saved?.defaultZone === 'string' ? saved.defaultZone : defaults.defaultZone,
    compactTables: typeof saved?.compactTables === 'boolean' ? saved.compactTables : defaults.compactTables,
    autoPrintShiftBrief: false,
  }
}

export function writeOperatorPreferences(value: OperatorPreferences) {
  writeJson(preferencesKey, value)
}
