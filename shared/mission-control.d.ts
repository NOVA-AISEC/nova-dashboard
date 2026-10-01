import type { Mission } from './security-engine'
export interface MissionActivity {
  revision: number
  action:
    | 'proposed'
    | 'approved'
    | 'rejected'
    | 'step-recorded'
    | 'assigned'
    | 'paused'
    | 'resumed'
    | 'cancelled'
  actor: string
  at: string
  note: string
  team: string
  stepId: string
}
export function initializeMissionControl(mission: object, team: string): Mission
export function upgradeMissionControl(mission: Mission, team: string): Mission
export function recordMissionChange(
  previous: Mission,
  updated: Mission,
  action: MissionActivity['action'],
  note: string,
  actor: string,
  timestamp: string,
  details?: { team?: string; stepId?: string },
): Mission
export function assertMissionRevision(mission: Mission, expectedRevision: number): void
export function coordinateMission(
  mission: Mission,
  action: string,
  note: string,
  actor: string,
  timestamp: string,
  team?: string,
): Mission
export function validateMissionControl(mission: Mission): void
