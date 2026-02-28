export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'new' | 'triaging' | 'contained' | 'closed'
export type CasePriority = 'priority-1' | 'priority-2' | 'priority-3'
export type CaseStatus = 'active' | 'monitoring' | 'escalated' | 'closed'
export type SnapshotPalette = 'amber' | 'teal' | 'slate' | 'crimson'
export type TimelineEventKind =
  | 'alert'
  | 'triage'
  | 'evidence'
  | 'note'
  | 'handoff'
  | 'closure'

export interface EvidenceSnapshot {
  id: string
  title: string
  location: string
  cameraId: string
  capturedAt: string
  summary: string
  tags: string[]
  retention: string
  chainOfCustody: string
  redactions: string
  analyticsSummary: string
  relatedCaseId: string
  palette: SnapshotPalette
}

export interface AlertRecord {
  id: string
  title: string
  severity: AlertSeverity
  status: AlertStatus
  area: string
  openedAt: string
  updatedAt: string
  assignee: string
  rule: string
  summary: string
  caseId: string
  evidenceIds: string[]
}

export interface TimelineEvent {
  id: string
  kind: TimelineEventKind
  timestamp: string
  title: string
  detail: string
  operator: string
}

export interface CaseRecord {
  id: string
  title: string
  priority: CasePriority
  status: CaseStatus
  location: string
  openedAt: string
  updatedAt: string
  leadAnalyst: string
  summary: string
  protocol: string
  alertIds: string[]
  evidenceIds: string[]
  timeline: TimelineEvent[]
}

export interface OpsMetric {
  label: string
  value: string
  delta: string
  tone: 'accent' | 'ink' | 'success' | 'warning'
}
