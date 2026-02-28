import type {
  Alert,
  AuditEvent,
  Case,
  CreateCasePayload,
  Evidence,
  OpsMetric,
  SearchParams,
  SearchResults,
} from '@/types/domain'

export const evidence: Evidence[] = [
  {
    id: 'ev-204',
    title: 'Dock 7 service corridor crossing',
    summary:
      'Two-frame corridor crossing with a flagged handoff near the sealed loading corridor.',
    snapshotUrl: '/evidence/placeholder-1.jpg',
    metadata: {
      cameraId: 'CAM-07',
      zone: 'Dock 7 Corridor',
      ts: '2026-02-28T06:14:00Z',
      bboxList: [{ x: 0.18, y: 0.24, width: 0.21, height: 0.46 }],
      classes: ['person', 'service-cart'],
      confidence: 0.92,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-204-1',
        label: 'person',
        confidence: 0.92,
        bbox: { x: 0.18, y: 0.24, width: 0.21, height: 0.46 },
      },
    ],
    retention: '180-day export hold',
    chainOfCustody: 'SHA256 verified / evidence locker E-17',
    redactions: 'Faces blurred by policy, license regions masked',
    analyticsSummary: 'Trajectory anomaly + restricted-zone rule overlap',
    relatedCaseId: 'case-dock-7',
  },
  {
    id: 'ev-311',
    title: 'South gate vehicle linger',
    summary:
      'Delivery van paused beyond the dwell threshold before exiting through the service lane.',
    snapshotUrl: '/evidence/placeholder-2.jpg',
    metadata: {
      cameraId: 'CAM-02',
      zone: 'South Gate',
      ts: '2026-02-28T05:51:00Z',
      bboxList: [{ x: 0.29, y: 0.36, width: 0.42, height: 0.28 }],
      classes: ['vehicle'],
      confidence: 0.88,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-311-1',
        label: 'vehicle',
        confidence: 0.88,
        bbox: { x: 0.29, y: 0.36, width: 0.42, height: 0.28 },
      },
    ],
    retention: '90-day review window',
    chainOfCustody: 'Signed ingest / evidence locker V-04',
    redactions: 'Driver cabin blurred, plate hash stored separately',
    analyticsSummary: 'Vehicle dwell exceeded threshold by 11m 23s',
    relatedCaseId: 'case-gate-linger',
  },
  {
    id: 'ev-612',
    title: 'Perimeter thermal sweep',
    summary:
      'Thermal sweep flagged rapid heat signature movement against the fenced service road.',
    snapshotUrl: '/evidence/placeholder-3.jpg',
    metadata: {
      cameraId: 'THERM-3',
      zone: 'North Perimeter',
      ts: '2026-02-28T04:32:00Z',
      bboxList: [{ x: 0.45, y: 0.16, width: 0.18, height: 0.52 }],
      classes: ['thermal-signature'],
      confidence: 0.94,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-612-1',
        label: 'thermal-signature',
        confidence: 0.94,
        bbox: { x: 0.45, y: 0.16, width: 0.18, height: 0.52 },
      },
    ],
    retention: '120-day hold',
    chainOfCustody: 'Thermal feed notarized / evidence locker T-11',
    redactions: 'Silhouette only, no identity extraction permitted',
    analyticsSummary: 'Thermal vector crossed exclusion zone for 19 seconds',
    relatedCaseId: 'case-perimeter',
  },
  {
    id: 'ev-188',
    title: 'Loading bay package transfer',
    summary:
      'Package transfer occurred outside manifest update window with container seal mismatch.',
    snapshotUrl: '/evidence/placeholder-1.jpg',
    metadata: {
      cameraId: 'CAM-11',
      zone: 'Bay 3',
      ts: '2026-02-27T22:11:00Z',
      bboxList: [{ x: 0.34, y: 0.18, width: 0.22, height: 0.38 }],
      classes: ['package', 'person'],
      confidence: 0.84,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-188-1',
        label: 'package',
        confidence: 0.84,
        bbox: { x: 0.34, y: 0.18, width: 0.22, height: 0.38 },
      },
    ],
    retention: '180-day export hold',
    chainOfCustody: 'Export hash confirmed / evidence locker L-09',
    redactions: 'Operator faces blurred, barcode digits partially masked',
    analyticsSummary: 'Manifest mismatch correlated with delayed dock scan',
    relatedCaseId: 'case-dock-7',
  },
  {
    id: 'ev-431',
    title: 'Rooftop access stairwell',
    summary: 'Restricted stairwell door opened during a maintenance blackout window.',
    snapshotUrl: '/evidence/placeholder-3.jpg',
    metadata: {
      cameraId: 'CAM-19',
      zone: 'Admin Stairwell',
      ts: '2026-02-27T23:48:00Z',
      bboxList: [{ x: 0.57, y: 0.24, width: 0.14, height: 0.49 }],
      classes: ['person', 'door'],
      confidence: 0.86,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-431-1',
        label: 'door',
        confidence: 0.86,
        bbox: { x: 0.57, y: 0.24, width: 0.14, height: 0.49 },
      },
    ],
    retention: '60-day watchlist hold',
    chainOfCustody: 'Door event paired / evidence locker S-21',
    redactions: 'No biometric extraction; only motion contours stored',
    analyticsSummary: 'Access event deviated from approved maintenance roster',
    relatedCaseId: 'case-perimeter',
  },
  {
    id: 'ev-509',
    title: 'Courier vestibule queue anomaly',
    summary:
      'Vestibule queue compressed and reversed twice, triggering crowd-flow anomaly detection.',
    snapshotUrl: '/evidence/placeholder-2.jpg',
    metadata: {
      cameraId: 'CAM-04',
      zone: 'Courier Vestibule',
      ts: '2026-02-28T01:06:00Z',
      bboxList: [{ x: 0.23, y: 0.31, width: 0.36, height: 0.44 }],
      classes: ['person-group'],
      confidence: 0.9,
      biometricsDisabled: true,
      humanValidationRequired: true,
      source: 'snapshot',
    },
    detections: [
      {
        id: 'det-509-1',
        label: 'person-group',
        confidence: 0.9,
        bbox: { x: 0.23, y: 0.31, width: 0.36, height: 0.44 },
      },
    ],
    retention: '30-day operational hold',
    chainOfCustody: 'Snapshot bundle signed / evidence locker C-02',
    redactions: 'Facial regions removed in source frame',
    analyticsSummary: 'Flow reversal exceeded baseline by 3.7x',
    relatedCaseId: 'case-gate-linger',
  },
]

export const alerts: Alert[] = [
  {
    id: 'alt-931',
    title: 'Restricted corridor handoff',
    severity: 'critical',
    status: 'triaging',
    zone: 'Dock 7 Corridor',
    cameraId: 'CAM-07',
    createdAt: '2026-02-28T06:14:00Z',
    updatedAt: '2026-02-28T06:22:00Z',
    assignee: 'Shift Alpha',
    rule: 'Restricted-zone object exchange',
    summary: 'Cross-zone handoff with manifest mismatch on adjacent bay scan.',
    caseId: 'case-dock-7',
    evidenceIds: ['ev-204', 'ev-188'],
    requiresHumanValidation: true,
  },
  {
    id: 'alt-944',
    title: 'Thermal perimeter vector',
    severity: 'critical',
    status: 'new',
    zone: 'North Perimeter',
    cameraId: 'THERM-3',
    createdAt: '2026-02-28T04:32:00Z',
    updatedAt: '2026-02-28T04:37:00Z',
    assignee: 'Shift Bravo',
    rule: 'Thermal exclusion-zone crossing',
    summary: 'Heat signature traversed the outer fence lane without a scheduled escort.',
    caseId: 'case-perimeter',
    evidenceIds: ['ev-612'],
    requiresHumanValidation: true,
  },
  {
    id: 'alt-918',
    title: 'South gate dwell threshold',
    severity: 'high',
    status: 'contained',
    zone: 'South Gate',
    cameraId: 'CAM-02',
    createdAt: '2026-02-28T05:51:00Z',
    updatedAt: '2026-02-28T06:04:00Z',
    assignee: 'Shift Alpha',
    rule: 'Vehicle linger > 10m',
    summary: 'Vehicle exited the lane after manual radio challenge from gate operations.',
    caseId: 'case-gate-linger',
    evidenceIds: ['ev-311'],
    requiresHumanValidation: true,
  },
  {
    id: 'alt-907',
    title: 'Courier vestibule reversal',
    severity: 'medium',
    status: 'triaging',
    zone: 'Courier Vestibule',
    cameraId: 'CAM-04',
    createdAt: '2026-02-28T01:06:00Z',
    updatedAt: '2026-02-28T01:14:00Z',
    assignee: 'Logistics Watch',
    rule: 'Queue compression / reversal',
    summary: 'Flow reversal suggested an unlogged screening delay at the vestibule.',
    caseId: 'case-gate-linger',
    evidenceIds: ['ev-509'],
    requiresHumanValidation: true,
  },
  {
    id: 'alt-884',
    title: 'Rooftop stairwell access',
    severity: 'high',
    status: 'new',
    zone: 'Admin Stairwell',
    cameraId: 'CAM-19',
    createdAt: '2026-02-27T23:48:00Z',
    updatedAt: '2026-02-27T23:56:00Z',
    assignee: 'Facilities Desk',
    rule: 'Restricted door open during blackout',
    summary: 'Door access event did not map to the approved maintenance roster.',
    caseId: 'case-perimeter',
    evidenceIds: ['ev-431'],
    requiresHumanValidation: true,
  },
  {
    id: 'alt-866',
    title: 'Manifest deviation',
    severity: 'medium',
    status: 'closed',
    zone: 'Bay 3',
    cameraId: 'CAM-11',
    createdAt: '2026-02-27T22:11:00Z',
    updatedAt: '2026-02-27T22:49:00Z',
    assignee: 'Dock Supervisor',
    rule: 'Scan mismatch',
    summary: 'Transfer reconciled after manual inventory count and seal photo review.',
    caseId: 'case-dock-7',
    evidenceIds: ['ev-188'],
    requiresHumanValidation: true,
  },
]

export const cases: Case[] = [
  {
    id: 'case-dock-7',
    title: 'Dock 7 restricted handoff',
    priority: 'priority-1',
    status: 'active',
    location: 'Dock 7 Corridor / Bay 3',
    openedAt: '2026-02-28T06:14:00Z',
    updatedAt: '2026-02-28T06:29:00Z',
    leadAnalyst: 'M. Rivera',
    summary:
      'Correlated corridor handoff and manifest deviation indicate unscheduled material movement across a sealed logistics zone.',
    protocol:
      'Evidence-only review, export package for logistics compliance, no identity resolution.',
    alertIds: ['alt-931', 'alt-866'],
    evidenceIds: ['ev-204', 'ev-188'],
    timeline: [
      {
        id: 'dock-evt-1',
        kind: 'alert',
        timestamp: '2026-02-28T06:14:00Z',
        title: 'Primary alert triggered',
        detail: 'Restricted-zone handoff rule fired against CAM-07 corridor snapshots.',
        operator: 'DAMA LTD Core',
      },
      {
        id: 'dock-evt-2',
        kind: 'evidence',
        timestamp: '2026-02-28T06:17:00Z',
        title: 'Evidence bundle sealed',
        detail: 'Hash-verified corridor frames linked with adjacent manifest exception evidence.',
        operator: 'Evidence Vault',
      },
      {
        id: 'dock-evt-3',
        kind: 'triage',
        timestamp: '2026-02-28T06:21:00Z',
        title: 'Triage opened',
        detail: 'Shift Alpha elevated the event to priority case review.',
        operator: 'M. Rivera',
      },
      {
        id: 'dock-evt-4',
        kind: 'handoff',
        timestamp: '2026-02-28T06:29:00Z',
        title: 'Compliance handoff queued',
        detail: 'Preparing export package for logistics audit with redactions preserved.',
        operator: 'Case Desk',
      },
    ],
    humanValidationRequired: true,
  },
  {
    id: 'case-gate-linger',
    title: 'South gate dwell anomaly',
    priority: 'priority-2',
    status: 'monitoring',
    location: 'South Gate / Courier Vestibule',
    openedAt: '2026-02-28T01:06:00Z',
    updatedAt: '2026-02-28T06:04:00Z',
    leadAnalyst: 'T. Osei',
    summary:
      'Vehicle dwell and queue reversal suggest screening throughput issues with possible escort mismatch at the south gate.',
    protocol: 'Operational watch only; preserve motion snapshots and audit notes.',
    alertIds: ['alt-918', 'alt-907'],
    evidenceIds: ['ev-311', 'ev-509'],
    timeline: [
      {
        id: 'gate-evt-1',
        kind: 'alert',
        timestamp: '2026-02-28T01:06:00Z',
        title: 'Queue anomaly opened',
        detail: 'Vestibule flow reversal crossed baseline deviation threshold.',
        operator: 'DAMA LTD Core',
      },
      {
        id: 'gate-evt-2',
        kind: 'note',
        timestamp: '2026-02-28T05:58:00Z',
        title: 'Gate radio challenge logged',
        detail: 'Vehicle acknowledged and cleared after manual lane instructions.',
        operator: 'South Gate Desk',
      },
      {
        id: 'gate-evt-3',
        kind: 'closure',
        timestamp: '2026-02-28T06:04:00Z',
        title: 'Immediate risk contained',
        detail: 'Watch remains open for recurrence during next courier window.',
        operator: 'T. Osei',
      },
    ],
    humanValidationRequired: true,
  },
  {
    id: 'case-perimeter',
    title: 'North perimeter thermal incursion',
    priority: 'priority-1',
    status: 'escalated',
    location: 'North Perimeter / Admin Stairwell',
    openedAt: '2026-02-27T23:48:00Z',
    updatedAt: '2026-02-28T04:37:00Z',
    leadAnalyst: 'K. Sutton',
    summary:
      'Thermal sweep and stairwell access exceptions suggest a coordinated perimeter probe spanning two monitored surfaces.',
    protocol: 'Escalate to facility response, maintain silhouette-only evidence package.',
    alertIds: ['alt-944', 'alt-884'],
    evidenceIds: ['ev-612', 'ev-431'],
    timeline: [
      {
        id: 'per-evt-1',
        kind: 'alert',
        timestamp: '2026-02-27T23:48:00Z',
        title: 'Stairwell access exception',
        detail: 'Restricted door opened during blackout maintenance window.',
        operator: 'DAMA LTD Core',
      },
      {
        id: 'per-evt-2',
        kind: 'evidence',
        timestamp: '2026-02-28T04:32:00Z',
        title: 'Thermal sweep linked',
        detail: 'Thermal vector attached to case as secondary evidence stream.',
        operator: 'Evidence Vault',
      },
      {
        id: 'per-evt-3',
        kind: 'handoff',
        timestamp: '2026-02-28T04:37:00Z',
        title: 'Facility response engaged',
        detail: 'Case escalated to perimeter response with export lock enabled.',
        operator: 'K. Sutton',
      },
    ],
    humanValidationRequired: true,
  },
]

export const auditEvents: AuditEvent[] = [
  {
    id: 'audit-001',
    entityType: 'alert',
    entityId: 'alt-931',
    action: 'ALERT_INGESTED',
    actor: 'simulator',
    timestamp: '2026-02-28T06:14:00Z',
    metadata: { source: 'seed' },
  },
  {
    id: 'audit-002',
    entityType: 'case',
    entityId: 'case-dock-7',
    action: 'CASE_REVIEW_OPENED',
    actor: 'M. Rivera',
    timestamp: '2026-02-28T06:21:00Z',
  },
  {
    id: 'audit-003',
    entityType: 'alert',
    entityId: 'alt-918',
    action: 'ALERT_ACKNOWLEDGED',
    actor: 'Shift Alpha',
    timestamp: '2026-02-28T06:04:00Z',
  },
]

const complianceNotices = [
  'Snapshots plus metadata only. No raw video is stored in DAMA LTD evidence records.',
  'Biometric identification, facial recognition, and identity inference remain disabled.',
  'Human analyst validation is required before case escalation or export.',
]

export function getComplianceNotices() {
  return complianceNotices
}

export function getAlertMetrics(): OpsMetric[] {
  const activeAlerts = alerts.filter((alert) => alert.status !== 'closed')
  const escalatedCases = cases.filter((caseItem) => caseItem.status === 'escalated').length

  return [
    {
      label: 'Open alert load',
      value: String(activeAlerts.length).padStart(2, '0'),
      delta: `${alerts.filter((alert) => alert.severity === 'critical').length} critical`,
      tone: 'accent',
    },
    {
      label: 'Evidence bundles sealed',
      value: String(evidence.length).padStart(2, '0'),
      delta: 'Snapshots + metadata only',
      tone: 'success',
    },
    {
      label: 'Escalated cases',
      value: String(escalatedCases).padStart(2, '0'),
      delta: 'Human validation required',
      tone: 'warning',
    },
    {
      label: 'Biometric actions',
      value: '00',
      delta: 'Disabled by policy',
      tone: 'ink',
    },
  ]
}

export function findCaseById(caseId: string) {
  return cases.find((item) => item.id === caseId)
}

export function hydrateCase(caseId: string) {
  const match = findCaseById(caseId)

  if (!match) {
    return undefined
  }

  return {
    ...match,
    alerts: alerts.filter((item) => item.caseId === caseId),
    evidence: evidence.filter((item) => item.relatedCaseId === caseId),
    audit: auditEvents.filter(
      (item) =>
        item.entityId === caseId ||
        alerts.some((alert) => alert.caseId === caseId && alert.id === item.entityId),
    ),
  }
}

export function createCaseRecord(payload: CreateCasePayload) {
  const now = new Date().toISOString()
  const nextCase: Case = {
    id: `case-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    priority: payload.priority,
    status: payload.status,
    location: payload.location,
    openedAt: now,
    updatedAt: now,
    leadAnalyst: payload.leadAnalyst,
    summary: payload.summary,
    protocol: payload.protocol,
    alertIds: payload.alertIds ?? [],
    evidenceIds: payload.evidenceIds ?? [],
    timeline: [
      {
        id: `timeline-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'note',
        timestamp: now,
        title: 'Case created',
        detail: 'Case opened in local mock mode.',
        operator: payload.leadAnalyst,
      },
    ],
    humanValidationRequired: true,
  }

  cases.unshift(nextCase)
  auditEvents.unshift({
    id: `audit-${Math.random().toString(36).slice(2, 8)}`,
    entityType: 'case',
    entityId: nextCase.id,
    action: 'CASE_CREATED',
    actor: payload.leadAnalyst,
    timestamp: now,
  })

  return nextCase
}

export function updateAlertAck(id: string) {
  const alert = alerts.find((item) => item.id === id)

  if (!alert) {
    return undefined
  }

  alert.status = 'acknowledged'
  alert.updatedAt = new Date().toISOString()

  auditEvents.unshift({
    id: `audit-${Math.random().toString(36).slice(2, 8)}`,
    entityType: 'alert',
    entityId: alert.id,
    action: 'ALERT_ACKNOWLEDGED',
    actor: 'mock-operator',
    timestamp: alert.updatedAt,
  })

  return alert
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort()
}

function inDateRange(value: string, from?: string, to?: string) {
  const ts = new Date(value).getTime()

  if (from && ts < new Date(from).getTime()) {
    return false
  }

  if (to && ts > new Date(to).getTime()) {
    return false
  }

  return true
}

function matchesText(parts: string[], query?: string) {
  if (!query?.trim()) {
    return true
  }

  return parts.join(' ').toLowerCase().includes(query.trim().toLowerCase())
}

export function searchDataset(params: SearchParams = {}): SearchResults {
  const filteredEvidence = evidence.filter((item) => {
    const matchesCamera =
      !params.cameraId || params.cameraId === 'all' || item.metadata.cameraId === params.cameraId
    const matchesClass =
      !params.class ||
      params.class === 'all' ||
      item.metadata.classes.some((entry) => entry === params.class)
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

  const filteredAlerts = alerts.filter((item) => {
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

    return (
      matchesCamera &&
      matchesSeverity &&
      matchesStatus &&
      matchesRange &&
      matchesQuery
    )
  })

  const caseIds = new Set([
    ...filteredEvidence.map((item) => item.relatedCaseId),
    ...filteredAlerts.map((item) => item.caseId),
  ])

  const filteredCases = cases.filter((item) => caseIds.has(item.id))
  const filteredAudit = auditEvents.filter(
    (item) =>
      caseIds.has(item.entityId) ||
      filteredAlerts.some((alert) => alert.id === item.entityId),
  )

  return {
    alerts: filteredAlerts,
    cases: filteredCases,
    evidence: filteredEvidence,
    audit: filteredAudit,
    cameras: unique(evidence.map((item) => item.metadata.cameraId)),
    zones: unique(evidence.map((item) => item.metadata.zone)),
  }
}
