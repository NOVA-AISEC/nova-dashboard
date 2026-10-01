import type { SearchResults } from '../src/types/domain'

export interface PlaybookStep {
  id: string
  title: string
  detail: string
  owner: string
}
export interface Playbook {
  id: string
  name: string
  category: string
  description: string
  match: string[]
  keywords: RegExp
  steps: PlaybookStep[]
}
export interface EngineSource {
  id: string
  kind: 'alert' | 'evidence' | 'case'
  title: string
  detail: string
  location: string
  cameraId: string
  recordedAt: string
}
export interface EngineContext {
  caseContextIncluded: boolean
  incident: {
    id: string
    title: string
    severity: string
    status: string
    location: string
    assignee: string
    recordedAt: string
  }
  sources: EngineSource[]
  gaps: string[]
  playbookId: string
}
export interface Assessment {
  summary: string
  observations: { text: string; sourceIds: string[] }[]
  uncertainties: string[]
  recommendedStepIds: string[]
}
export interface EngineRun {
  id: string
  createdAt: string
  actor: string
  intent: string
  question: string
  provider: 'placeholder'
  model: string
  context: EngineContext
  assessment: Assessment
  vision: import('./vision-engine').VisionFrame[]
}
export interface Mission {
  id: string
  runId: string
  incidentId: string
  title: string
  severity: string
  location: string
  status: 'pending-approval' | 'active' | 'paused' | 'cancelled' | 'rejected' | 'completed'
  revision: number
  assignedTeam: string
  activity: import('./mission-control').MissionActivity[]
  createdAt: string
  updatedAt: string
  createdBy: string
  playbookId: string
  summary: string
  decisionBy: string
  decisionNote: string
  decidedAt: string
  steps: (PlaybookStep & {
    status: 'pending' | 'completed'
    completedBy: string
    completedAt: string
    note: string
  })[]
}
export interface EngineStatus {
  provider: 'placeholder'
  model: string
  ready: boolean
  label: string
  detail: string
  inferenceConnected: boolean
  cameraConnected: boolean
}
export interface SecurityState {
  runs: EngineRun[]
  missions: Mission[]
  engine: EngineStatus
}
export const playbooks: Playbook[]
export function selectPlaybook(alert: { category?: string; title: string; rule: string }): Playbook
export function buildContext(
  records: SearchResults,
  incidentId: string,
  role?: string,
): EngineContext
export function sampleAssessment(context: EngineContext, intent?: string): Assessment
export function validateAssessment(value: unknown, context: EngineContext): Assessment
export function contextVersion(context: EngineContext): string
export function assertFreshRun(run: EngineRun, records: SearchResults, now?: number): void
export function validateSecurityRecords(value: unknown): { runs: EngineRun[]; missions: Mission[] }
export function missionFromRun(
  run: EngineRun,
  actor: string,
  timestamp: string,
  id: string,
): Mission
export function decideMission(
  mission: Mission,
  decision: string,
  note: string,
  actor: string,
  timestamp: string,
): Mission
export function completeMissionStep(
  mission: Mission,
  stepId: string,
  note: string,
  actor: string,
  timestamp: string,
): Mission
