export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'new' | 'acknowledged' | 'triaging' | 'contained' | 'closed'
export type CasePriority = 'priority-1' | 'priority-2' | 'priority-3'
export type CaseStatus = 'active' | 'monitoring' | 'escalated' | 'closed'
export type TimelineEventKind =
  | 'alert'
  | 'triage'
  | 'evidence'
  | 'note'
  | 'handoff'
  | 'closure'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Detection {
  id: string
  label: string
  confidence: number
  bbox: BoundingBox
}

export interface EvidenceMetadata {
  cameraId: string
  zone: string
  ts: string
  bboxList: BoundingBox[]
  classes: string[]
  confidence: number
  biometricsDisabled: true
  humanValidationRequired: true
  source: 'snapshot'
}

export interface Evidence {
  id: string
  title: string
  summary: string
  snapshotUrl: string
  metadata: EvidenceMetadata
  detections: Detection[]
  retention: string
  chainOfCustody: string
  redactions: string
  analyticsSummary: string
  relatedCaseId: string
}

export interface Alert {
  id: string
  title: string
  severity: AlertSeverity
  status: AlertStatus
  zone: string
  cameraId: string
  createdAt: string
  updatedAt: string
  assignee: string
  rule: string
  summary: string
  caseId: string
  evidenceIds: string[]
  requiresHumanValidation: true
}

export interface CaseTimelineEvent {
  id: string
  kind: TimelineEventKind
  timestamp: string
  title: string
  detail: string
  operator: string
}

export interface Case {
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
  timeline: CaseTimelineEvent[]
  humanValidationRequired: true
  alerts?: Alert[]
  evidence?: Evidence[]
  audit?: AuditEvent[]
}

export interface AuditEvent {
  id: string
  entityType: 'alert' | 'case' | 'evidence' | 'simulator'
  entityId: string
  action: string
  actor: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface SearchResults {
  alerts: Alert[]
  cases: Case[]
  evidence: Evidence[]
  audit: AuditEvent[]
  cameras: string[]
  zones: string[]
}

export interface ListAlertsParams {
  status?: string
  severity?: string
  cameraId?: string
  from?: string
  to?: string
  q?: string
  page?: number
  pageSize?: number
}

export interface SearchParams {
  q?: string
  from?: string
  to?: string
  cameraId?: string
  class?: string
  severity?: string
  status?: string
}

export interface CreateCasePayload {
  title: string
  priority: CasePriority
  status: CaseStatus
  location: string
  summary: string
  protocol: string
  leadAnalyst: string
  alertIds?: string[]
  evidenceIds?: string[]
}

export interface OpsMetric {
  label: string
  value: string
  delta: string
  tone: 'accent' | 'ink' | 'success' | 'warning'
}
