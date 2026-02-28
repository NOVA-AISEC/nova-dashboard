import type {
  BottleneckSolution,
  CampusContextArea,
  CampusEvent,
  CampusUserRecord,
  CampusZoneStatus,
  EvidenceExportRecord,
  TrafficAdvisory,
  VehicleSighting,
} from '@/types/domain'

export const campusContextAreas: CampusContextArea[] = [
  { name: 'Main Gate / Side Gate', detail: 'Inbound screening, guest triage, and vehicle flow.' },
  { name: 'Hostels / Residences', detail: 'Access exceptions, late return logging, and lobby watch.' },
  { name: 'Admin Block', detail: 'Restricted entry review and escorted access checks.' },
  { name: 'Library', detail: 'Unattended item workflow and study-hour crowd management.' },
  { name: 'Cafeteria', detail: 'Lunch surge monitoring and dispatch coordination.' },
  { name: 'Parking', detail: 'Parking A, lane build-up, and incident-backed traffic updates.' },
  { name: 'Lecture Blocks', detail: 'Lost property intake and event ingress visibility.' },
  { name: 'Perimeter', detail: 'Fence-line patrols, thermal watch, and gate-to-patrol handoff.' },
  { name: 'Service Bay', detail: 'Vendor arrivals, delivery dwell, and exception logging.' },
]

export const bottleneckSolutions: BottleneckSolution[] = [
  {
    title: 'Faster incident triage',
    detail: 'Queue sorting by severity and zone reduces handoff delay at the incident desk.',
  },
  {
    title: 'Evidence pack export for admin review',
    detail: 'Exports bundle snapshots plus metadata only, with chain-of-custody preserved.',
  },
  {
    title: 'Vehicle search by time and zone',
    detail: 'Guards can filter by color, type, and travel direction without biometrics or plate OCR.',
  },
  {
    title: 'Unattended item workflow',
    detail: 'Library and lecture-block reports split lost & found from suspicious-item escalation.',
  },
  {
    title: 'Shift handover briefs',
    detail: 'Queue, cases, and notes roll into a printable brief to reduce information loss.',
  },
  {
    title: 'Escalation chain',
    detail: 'Supervisor to Student Affairs or admin review is explicit when campus action is needed.',
  },
]

export const campusAlertCategories = [
  'unattended-item',
  'perimeter-intrusion',
  'tailgating',
  'crowd-surge',
  'restricted-access-exception',
  'parking-incident',
  'lost-property-intake',
  'vehicle-interest',
] as const

export const campusZones: CampusZoneStatus[] = [
  {
    id: 'zone-1',
    name: 'Main Gate  Lane 1',
    cameraId: 'STR-MG-01',
    status: 'watch',
    coverage: 'Vehicle lane / guard bay',
    lastCheckedAt: '2026-02-28T06:20:00Z',
    alertCount: 1,
  },
  {
    id: 'zone-2',
    name: 'Library Entrance',
    cameraId: 'STR-LIB-02',
    status: 'watch',
    coverage: 'Entry vestibule / desk sightline',
    lastCheckedAt: '2026-02-28T07:09:00Z',
    alertCount: 1,
  },
  {
    id: 'zone-3',
    name: 'Residence Block B  Lobby',
    cameraId: 'STR-RB-03',
    status: 'watch',
    coverage: 'Lobby door / reception desk',
    lastCheckedAt: '2026-02-28T05:57:00Z',
    alertCount: 1,
  },
  {
    id: 'zone-4',
    name: 'Parking A  East',
    cameraId: 'STR-PK-04',
    status: 'healthy',
    coverage: 'Exit lane / pedestrian edge',
    lastCheckedAt: '2026-02-28T08:16:00Z',
    alertCount: 1,
  },
  {
    id: 'zone-5',
    name: 'Perimeter  North Fence',
    cameraId: 'STR-PER-05',
    status: 'watch',
    coverage: 'Thermal sweep / fence line',
    lastCheckedAt: '2026-02-28T04:22:00Z',
    alertCount: 1,
  },
  {
    id: 'zone-6',
    name: 'Service Bay',
    cameraId: 'STR-SVC-01',
    status: 'maintenance',
    coverage: 'Vendor dwell / loading curb',
    lastCheckedAt: '2026-02-28T03:50:00Z',
    alertCount: 0,
  },
]

export const campusEvents: CampusEvent[] = [
  {
    id: 'evt-701',
    title: 'Career Fair ingress watch',
    zone: 'Lecture Blocks / Cafeteria Walkway',
    startsAt: '2026-02-28T10:30:00Z',
    status: 'live',
    crowdLevel: 'high',
    detail: 'Event control is watching spillover between lecture blocks and the cafeteria forecourt.',
  },
  {
    id: 'evt-702',
    title: 'Residence hall late-arrival window',
    zone: 'Residence Block B  Lobby',
    startsAt: '2026-02-28T21:00:00Z',
    status: 'scheduled',
    crowdLevel: 'moderate',
    detail: 'Hostel desk expects elevated access exceptions and manual validations after evening check-ins.',
  },
  {
    id: 'evt-703',
    title: 'Perimeter patrol overlap',
    zone: 'Perimeter  North Fence / Service Bay',
    startsAt: '2026-02-28T18:00:00Z',
    status: 'monitoring',
    crowdLevel: 'low',
    detail: 'Supervisor review remains active while the service bay camera is in maintenance.',
  },
]

export const vehicleSightings: VehicleSighting[] = [
  {
    id: 'veh-701',
    zone: 'Main Gate  Lane 1',
    timestamp: '2026-02-28T06:12:00Z',
    color: 'Silver',
    type: 'SUV',
    direction: 'Inbound',
    attributes: ['roof rack', 'campus visitor pass visible'],
    linkedAlertId: 'alt-701',
    humanValidationRequired: true,
  },
  {
    id: 'veh-702',
    zone: 'Parking A  East',
    timestamp: '2026-02-28T08:10:00Z',
    color: 'Blue',
    type: 'Hatchback',
    direction: 'Outbound',
    attributes: ['hazard lights on', 'stall at exit barrier'],
    linkedAlertId: 'alt-706',
    humanValidationRequired: true,
  },
  {
    id: 'veh-703',
    zone: 'Side Gate',
    timestamp: '2026-02-28T07:34:00Z',
    color: 'White',
    type: 'Van',
    direction: 'Inbound',
    attributes: ['vendor decal', 'service bay routing note'],
    humanValidationRequired: true,
  },
  {
    id: 'veh-704',
    zone: 'Service Bay',
    timestamp: '2026-02-28T09:02:00Z',
    color: 'Maroon',
    type: 'Pickup',
    direction: 'Outbound',
    attributes: ['covered cargo bed', 'escort required'],
    humanValidationRequired: true,
  },
]

export const trafficAdvisories: TrafficAdvisory[] = [
  {
    id: 'traf-701',
    zone: 'Main Gate / Side Gate',
    status: 'watch',
    summary: 'Inbound lane volume is elevated after the morning arrival wave.',
    updatedAt: '2026-02-28T06:25:00Z',
  },
  {
    id: 'traf-702',
    zone: 'Parking A  East',
    status: 'action',
    summary: 'Parking attendants are holding the east exit for staggered release after a stalled vehicle.',
    updatedAt: '2026-02-28T08:16:00Z',
  },
  {
    id: 'traf-703',
    zone: 'Cafeteria Walkway',
    status: 'stable',
    summary: 'Lunch surge has eased after event traffic diversion toward Lecture Block C.',
    updatedAt: '2026-02-28T11:55:00Z',
  },
]

export const evidenceExports: EvidenceExportRecord[] = [
  {
    id: 'exp-701',
    caseId: 'case-library-item',
    requestedBy: 'Incident Desk',
    requestedAt: '2026-02-28T09:30:00Z',
    destination: 'Admin Review',
    status: 'pending-review',
    packageType: 'Snapshots + metadata bundle',
  },
  {
    id: 'exp-702',
    caseId: 'case-residence-access',
    requestedBy: 'Security Supervisor',
    requestedAt: '2026-02-28T08:42:00Z',
    destination: 'Student Affairs',
    status: 'ready',
    packageType: 'Access exception brief',
  },
  {
    id: 'exp-703',
    caseId: 'case-perimeter-watch',
    requestedBy: 'Security Supervisor',
    requestedAt: '2026-02-28T04:40:00Z',
    destination: 'Campus Admin',
    status: 'released',
    packageType: 'Perimeter patrol packet',
  },
]

export const campusUsers: CampusUserRecord[] = [
  {
    id: 'usr-701',
    name: 'Jane Mwangi',
    role: 'Guard',
    team: 'Main Gate',
    accessScope: 'Ops, Queue, Alerts, Reports',
  },
  {
    id: 'usr-702',
    name: 'Peter Wambui',
    role: 'Analyst',
    team: 'Incident Desk',
    accessScope: 'Ops, Alerts, Cases, Search, Vehicles, Audit',
  },
  {
    id: 'usr-703',
    name: 'Ruth Otieno',
    role: 'Supervisor',
    team: 'Campus Security',
    accessScope: 'All routes except Users & Roles',
  },
  {
    id: 'usr-704',
    name: 'Admin Office',
    role: 'Admin',
    team: 'Operations Systems',
    accessScope: 'Full access',
  },
]

export const complianceNotices = [
  'Snapshots plus metadata only. No raw video is stored in campus evidence records.',
  'Biometrics are disabled. Facial recognition and identity inference are not available.',
  'Human analyst validation is required before dispatch escalation, export, or closure.',
]
