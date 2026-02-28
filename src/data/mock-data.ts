import type {
  AlertRecord,
  CaseRecord,
  EvidenceSnapshot,
  OpsMetric,
} from '@/types/domain'

export const evidenceSnapshots: EvidenceSnapshot[] = [
  {
    id: 'ev-204',
    title: 'Dock 7 service corridor crossing',
    location: 'Dock 7 Corridor',
    cameraId: 'CAM-07',
    capturedAt: '2026-02-28T06:14:00Z',
    summary:
      'Two-frame corridor crossing with a flagged handoff near the sealed loading corridor.',
    tags: ['handoff', 'corridor', 'after-hours', 'service-cart'],
    retention: '180-day export hold',
    chainOfCustody: 'SHA256 verified / evidence locker E-17',
    redactions: 'Faces blurred by policy, license regions masked',
    analyticsSummary: 'Trajectory anomaly + restricted-zone rule overlap',
    relatedCaseId: 'case-dock-7',
    palette: 'amber',
  },
  {
    id: 'ev-311',
    title: 'South gate vehicle linger',
    location: 'South Gate',
    cameraId: 'CAM-02',
    capturedAt: '2026-02-28T05:51:00Z',
    summary:
      'Delivery van paused beyond the dwell threshold before exiting through the service lane.',
    tags: ['vehicle', 'linger', 'south-gate'],
    retention: '90-day review window',
    chainOfCustody: 'Signed ingest / evidence locker V-04',
    redactions: 'Driver cabin blurred, plate hash stored separately',
    analyticsSummary: 'Vehicle dwell exceeded threshold by 11m 23s',
    relatedCaseId: 'case-gate-linger',
    palette: 'slate',
  },
  {
    id: 'ev-612',
    title: 'Perimeter thermal sweep',
    location: 'North Perimeter',
    cameraId: 'THERM-3',
    capturedAt: '2026-02-28T04:32:00Z',
    summary:
      'Thermal sweep flagged rapid heat signature movement against the fenced service road.',
    tags: ['thermal', 'perimeter', 'night-shift'],
    retention: '120-day hold',
    chainOfCustody: 'Thermal feed notarized / evidence locker T-11',
    redactions: 'Silhouette only, no identity extraction permitted',
    analyticsSummary: 'Thermal vector crossed exclusion zone for 19 seconds',
    relatedCaseId: 'case-perimeter',
    palette: 'crimson',
  },
  {
    id: 'ev-188',
    title: 'Loading bay package transfer',
    location: 'Bay 3',
    cameraId: 'CAM-11',
    capturedAt: '2026-02-27T22:11:00Z',
    summary:
      'Package transfer occurred outside manifest update window with container seal mismatch.',
    tags: ['package', 'loading-bay', 'manifest'],
    retention: '180-day export hold',
    chainOfCustody: 'Export hash confirmed / evidence locker L-09',
    redactions: 'Operator faces blurred, barcode digits partially masked',
    analyticsSummary: 'Manifest mismatch correlated with delayed dock scan',
    relatedCaseId: 'case-dock-7',
    palette: 'teal',
  },
  {
    id: 'ev-431',
    title: 'Rooftop access stairwell',
    location: 'Admin Stairwell',
    cameraId: 'CAM-19',
    capturedAt: '2026-02-27T23:48:00Z',
    summary:
      'Restricted stairwell door opened during a maintenance blackout window.',
    tags: ['access-control', 'stairwell', 'maintenance'],
    retention: '60-day watchlist hold',
    chainOfCustody: 'Door event paired / evidence locker S-21',
    redactions: 'No biometric extraction; only motion contours stored',
    analyticsSummary: 'Access event deviated from approved maintenance roster',
    relatedCaseId: 'case-perimeter',
    palette: 'slate',
  },
  {
    id: 'ev-509',
    title: 'Courier vestibule queue anomaly',
    location: 'Courier Vestibule',
    cameraId: 'CAM-04',
    capturedAt: '2026-02-28T01:06:00Z',
    summary:
      'Vestibule queue compressed and reversed twice, triggering crowd-flow anomaly detection.',
    tags: ['queue', 'vestibule', 'flow-reversal'],
    retention: '30-day operational hold',
    chainOfCustody: 'Snapshot bundle signed / evidence locker C-02',
    redactions: 'Facial regions removed in source frame',
    analyticsSummary: 'Flow reversal exceeded baseline by 3.7x',
    relatedCaseId: 'case-gate-linger',
    palette: 'amber',
  },
]

export const alerts: AlertRecord[] = [
  {
    id: 'alt-931',
    title: 'Restricted corridor handoff',
    severity: 'critical',
    status: 'triaging',
    area: 'Dock 7 Corridor',
    openedAt: '2026-02-28T06:14:00Z',
    updatedAt: '2026-02-28T06:22:00Z',
    assignee: 'Shift Alpha',
    rule: 'Restricted-zone object exchange',
    summary: 'Cross-zone handoff with manifest mismatch on adjacent bay scan.',
    caseId: 'case-dock-7',
    evidenceIds: ['ev-204', 'ev-188'],
  },
  {
    id: 'alt-944',
    title: 'Thermal perimeter vector',
    severity: 'critical',
    status: 'new',
    area: 'North Perimeter',
    openedAt: '2026-02-28T04:32:00Z',
    updatedAt: '2026-02-28T04:37:00Z',
    assignee: 'Shift Bravo',
    rule: 'Thermal exclusion-zone crossing',
    summary: 'Heat signature traversed the outer fence lane without a scheduled escort.',
    caseId: 'case-perimeter',
    evidenceIds: ['ev-612'],
  },
  {
    id: 'alt-918',
    title: 'South gate dwell threshold',
    severity: 'high',
    status: 'contained',
    area: 'South Gate',
    openedAt: '2026-02-28T05:51:00Z',
    updatedAt: '2026-02-28T06:04:00Z',
    assignee: 'Shift Alpha',
    rule: 'Vehicle linger > 10m',
    summary: 'Vehicle exited the lane after manual radio challenge from gate operations.',
    caseId: 'case-gate-linger',
    evidenceIds: ['ev-311'],
  },
  {
    id: 'alt-907',
    title: 'Courier vestibule reversal',
    severity: 'medium',
    status: 'triaging',
    area: 'Courier Vestibule',
    openedAt: '2026-02-28T01:06:00Z',
    updatedAt: '2026-02-28T01:14:00Z',
    assignee: 'Logistics Watch',
    rule: 'Queue compression / reversal',
    summary: 'Flow reversal suggested an unlogged screening delay at the vestibule.',
    caseId: 'case-gate-linger',
    evidenceIds: ['ev-509'],
  },
  {
    id: 'alt-884',
    title: 'Rooftop stairwell access',
    severity: 'high',
    status: 'new',
    area: 'Admin Stairwell',
    openedAt: '2026-02-27T23:48:00Z',
    updatedAt: '2026-02-27T23:56:00Z',
    assignee: 'Facilities Desk',
    rule: 'Restricted door open during blackout',
    summary: 'Door access event did not map to the approved maintenance roster.',
    caseId: 'case-perimeter',
    evidenceIds: ['ev-431'],
  },
  {
    id: 'alt-866',
    title: 'Manifest deviation',
    severity: 'medium',
    status: 'closed',
    area: 'Bay 3',
    openedAt: '2026-02-27T22:11:00Z',
    updatedAt: '2026-02-27T22:49:00Z',
    assignee: 'Dock Supervisor',
    rule: 'Scan mismatch',
    summary: 'Transfer reconciled after manual inventory count and seal photo review.',
    caseId: 'case-dock-7',
    evidenceIds: ['ev-188'],
  },
]

export const cases: CaseRecord[] = [
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
    protocol: 'Evidence-only review, export package for logistics compliance, no identity resolution.',
    alertIds: ['alt-931', 'alt-866'],
    evidenceIds: ['ev-204', 'ev-188'],
    timeline: [
      {
        id: 'dock-evt-1',
        kind: 'alert',
        timestamp: '2026-02-28T06:14:00Z',
        title: 'Primary alert triggered',
        detail: 'Restricted-zone handoff rule fired against CAM-07 corridor snapshots.',
        operator: 'Sentinel Core',
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
        operator: 'Sentinel Core',
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
        operator: 'Sentinel Core',
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
  },
]

export const opsMetrics: OpsMetric[] = [
  {
    label: 'Open alert load',
    value: '18',
    delta: '+4 vs prior shift',
    tone: 'accent',
  },
  {
    label: 'Evidence bundles sealed',
    value: '42',
    delta: '100% chain verified',
    tone: 'success',
  },
  {
    label: 'Escalated cases',
    value: '03',
    delta: '2 require immediate review',
    tone: 'warning',
  },
  {
    label: 'Biometric actions',
    value: '0',
    delta: 'Disabled by policy',
    tone: 'ink',
  },
]

export const complianceNotices = [
  'Evidence packages contain snapshots and metadata only.',
  'No biometric identification, face matching, or identity inference is enabled.',
  'Redactions are preserved through export and analyst handoff.',
]

export const searchLocations = Array.from(
  new Set(evidenceSnapshots.map((snapshot) => snapshot.location)),
)

export const searchCameras = Array.from(
  new Set(evidenceSnapshots.map((snapshot) => snapshot.cameraId)),
)

export function getCaseById(caseId: string) {
  return cases.find((item) => item.id === caseId)
}

export function getEvidenceForCase(caseId: string) {
  return evidenceSnapshots.filter((snapshot) => snapshot.relatedCaseId === caseId)
}

export function getAlertsForCase(caseId: string) {
  return alerts.filter((alert) => alert.caseId === caseId)
}

interface SearchEvidenceArgs {
  query: string
  location?: string
  cameraId?: string
}

export function searchEvidence({
  query,
  location,
  cameraId,
}: SearchEvidenceArgs) {
  const normalized = query.trim().toLowerCase()

  return evidenceSnapshots.filter((snapshot) => {
    const inLocation = !location || snapshot.location === location
    const inCamera = !cameraId || snapshot.cameraId === cameraId
    const haystack = [
      snapshot.id,
      snapshot.title,
      snapshot.location,
      snapshot.cameraId,
      snapshot.summary,
      snapshot.analyticsSummary,
      snapshot.tags.join(' '),
      snapshot.relatedCaseId,
    ]
      .join(' ')
      .toLowerCase()

    const matchesQuery = !normalized || haystack.includes(normalized)
    return inLocation && inCamera && matchesQuery
  })
}
