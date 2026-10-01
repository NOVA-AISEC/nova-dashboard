import { alerts, auditEvents, cases } from '@/data/mock-data'
import { alertSeedStates } from '@/data/campus-evidence-alerts'
import { caseSeedIds, auditSeedEvents } from '@/data/campus-cases-audit'
import { OPERATIONS_CHANGED } from '@/lib/operations'
import type { AlertStatus, AuditEvent, Case } from '@/types/domain'

const STORAGE_KEY = 'nova.operations.v2'
const seedCaseIds = caseSeedIds
const seedAudit = auditSeedEvents
const seedStatuses = alertSeedStates
interface SavedOperations {
  version: 2
  alerts: { id: string; status: AlertStatus; updatedAt: string }[]
  cases: Case[]
  audit: AuditEvent[]
}
function validCase(value: unknown): value is Case {
  if (!value || typeof value !== 'object') return false
  const item = value as Case
  return (
    ['id', 'title', 'location', 'openedAt', 'updatedAt', 'leadAnalyst', 'summary', 'protocol'].every(
      (key) => typeof item[key as keyof Case] === 'string',
    ) &&
    ['priority-1', 'priority-2', 'priority-3'].includes(item.priority) &&
    ['active', 'monitoring', 'escalated', 'closed'].includes(item.status) &&
    [item.openedAt, item.updatedAt].every((date) => Number.isFinite(Date.parse(date))) &&
    Array.isArray(item.alertIds) &&
    item.alertIds.every((id) => typeof id === 'string') &&
    Array.isArray(item.evidenceIds) &&
    item.evidenceIds.every((id) => typeof id === 'string') &&
    Array.isArray(item.timeline) &&
    item.timeline.every(
      (event) =>
        event &&
        ['id', 'title', 'detail', 'operator'].every(
          (key) => typeof event[key as keyof typeof event] === 'string',
        ) &&
        Number.isFinite(Date.parse(event.timestamp)),
    )
  )
}

export function restoreMockOperations() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const saved = raw ? (JSON.parse(raw) as SavedOperations) : null
    if (
      saved &&
      (saved.version !== 2 ||
        !Array.isArray(saved.alerts) ||
        !Array.isArray(saved.cases) ||
        !Array.isArray(saved.audit))
    )
      return
    for (const alert of alerts) {
      const seed = seedStatuses.get(alert.id)
      const state =
        (seed?.status === 'new'
          ? saved?.alerts.find(
              (item) =>
                item?.id === alert.id &&
                item.status === 'acknowledged' &&
                Number.isFinite(Date.parse(item.updatedAt)),
            )
          : undefined) ?? seed
      if (state) {
        alert.status = state.status
        alert.updatedAt = state.updatedAt
      }
    }
    const customCases = saved?.cases.filter((item) => validCase(item) && !seedCaseIds.has(item.id)) ?? []
    cases.splice(0, cases.length, ...customCases, ...cases.filter((item) => seedCaseIds.has(item.id)))
    const savedAudit =
      saved?.audit.filter(
        (item) =>
          item &&
          ['id', 'actor', 'entityId', 'action'].every(
            (key) => typeof item[key as keyof AuditEvent] === 'string',
          ) &&
          Number.isFinite(Date.parse(item.timestamp)) &&
          ['alert', 'case', 'evidence', 'simulator'].includes(item.entityType),
      ) ?? []
    auditEvents.splice(
      0,
      auditEvents.length,
      ...savedAudit,
      ...seedAudit.filter((item) => !savedAudit.some((event) => event.id === item.id)),
    )
  } catch {
    // An unavailable or malformed local cache must not prevent the workspace loading.
  }
}

export function persistMockOperations() {
  if (typeof window === 'undefined') return
  const saved: SavedOperations = {
    version: 2,
    alerts: alerts.map(({ id, status, updatedAt }) => ({ id, status, updatedAt })),
    cases: cases.filter((item) => !seedCaseIds.has(item.id)),
    audit: auditEvents,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    throw new Error(
      'Browser storage is full or unavailable. This action could not be saved; please free space and try again.',
    )
  }
}

restoreMockOperations()
if (typeof window !== 'undefined') {
  const syncOperations = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      restoreMockOperations()
      window.dispatchEvent(new Event(OPERATIONS_CHANGED))
    }
  }
  window.addEventListener('storage', syncOperations)
  import.meta.hot?.dispose(() => window.removeEventListener('storage', syncOperations))
}
