import type {
  AlertSeverity,
  AlertStatus,
  CasePriority,
  CaseStatus,
} from '@/types/domain'

export type ActionSignalTone = 'normal' | 'elevated' | 'critical'

export function getAlertSeverityTone(severity: AlertSeverity): ActionSignalTone {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'elevated'
    default:
      return 'normal'
  }
}

export function getAlertStatusTone(status: AlertStatus): ActionSignalTone {
  switch (status) {
    case 'new':
    case 'triaging':
      return 'elevated'
    default:
      return 'normal'
  }
}

export function getCasePriorityTone(priority: CasePriority): ActionSignalTone {
  switch (priority) {
    case 'priority-1':
      return 'critical'
    case 'priority-2':
      return 'elevated'
    default:
      return 'normal'
  }
}

export function getCaseStatusTone(status: CaseStatus): ActionSignalTone {
  switch (status) {
    case 'escalated':
      return 'critical'
    case 'monitoring':
      return 'elevated'
    default:
      return 'normal'
  }
}
