import type { ActionSignalTone } from '@/lib/action-gradient'

const rowClasses: Record<ActionSignalTone, string> = {
  normal: '',
  elevated: 'alert-accent-row-elevated',
  critical: 'alert-accent-row-critical',
}

export function getAlertAccentClassName(tone: ActionSignalTone) {
  return rowClasses[tone]
}
