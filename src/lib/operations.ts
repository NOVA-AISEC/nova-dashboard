import type { Alert, AlertStatus } from '@/types/domain'

export const OPERATIONS_CHANGED = 'nova:operations-changed'
export const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
export const statusLabels: Record<AlertStatus, string> = {
  new: 'Needs review',
  acknowledged: 'Acknowledged',
  triaging: 'In progress',
  contained: 'Contained',
  closed: 'Closed',
}
export function isActiveAlert(alert: Alert) {
  return alert.status !== 'closed' && alert.status !== 'contained'
}
export function sortAlerts(alerts: Alert[]) {
  return [...alerts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.createdAt.localeCompare(a.createdAt),
  )
}
export function notifyOperationsChanged() {
  window.dispatchEvent(new Event(OPERATIONS_CHANGED))
}
export function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
export function formatShiftDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
