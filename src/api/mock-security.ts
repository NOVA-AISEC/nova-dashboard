import { searchDataset } from '@/data/mock-data'
import { readDemoSession } from '@/lib/session'
import { OPERATIONS_CHANGED } from '@/lib/operations'
import type { AuditEvent } from '@/types/domain'
import {
  assertFreshRun,
  buildContext,
  sampleAssessment,
  validateAssessment,
  validateSecurityRecords,
  missionFromRun,
  decideMission as decide,
  completeMissionStep as complete,
  type EngineRun,
  type Mission,
  type SecurityState,
} from '../../shared/security-engine.js'
import { placeholderVision, visionEngineStatus } from '../../shared/vision-engine.js'
import {
  assertMissionRevision,
  coordinateMission as coordinate,
} from '../../shared/mission-control.js'

const key = 'nova.security-os.v1'
interface StoredState {
  version: 1
  runs: EngineRun[]
  missions: Mission[]
  audit: AuditEvent[]
}
const empty = (): StoredState => ({ version: 1, runs: [], missions: [], audit: [] })
function read(): StoredState {
  const raw = window.localStorage.getItem(key)
  if (!raw) return empty()
  if (raw.length > 8_000_000)
    throw new Error(
      'Security workspace storage is oversized. Export or clear site storage before continuing.',
    )
  try {
    const saved = JSON.parse(raw) as StoredState
    validateSecurityRecords(saved)
    if (
      saved.version !== 1 ||
      !Array.isArray(saved.audit) ||
      saved.audit.length > 5000 ||
      saved.audit.some(
        (event) =>
          !event ||
          !['id', 'actor', 'action', 'entityId'].every(
            (field) => typeof event[field as keyof AuditEvent] === 'string',
          ) ||
          event.entityType !== 'alert' ||
          !Number.isFinite(Date.parse(event.timestamp)),
      )
    )
      throw new Error('Invalid activity records')
    return saved
  } catch {
    throw new Error(
      'Saved security workspace records are invalid. Export or clear site storage before continuing.',
    )
  }
}
function actor() {
  const session = readDemoSession()
  if (!session) throw new Error('Sign in with a saved demo session to use the security workspace.')
  return session
}
function visible(saved: StoredState): SecurityState {
  const user = actor()
  const runs =
    user.role === 'guard'
      ? saved.runs.filter((run) => run.actor === user.email && !run.context.caseContextIncluded)
      : saved.runs
  return {
    runs,
    missions: saved.missions.filter((mission) => runs.some((run) => run.id === mission.runId)),
    engine: visionEngineStatus,
  }
}
function write(
  saved: StoredState,
  action: string,
  incidentId: string,
  metadata: Record<string, unknown>,
) {
  validateSecurityRecords(saved)
  if (saved.audit.length >= 5000)
    throw new Error('Security activity capacity reached. Archive the workspace before continuing.')
  saved.audit.unshift({
    id: `audit-${crypto.randomUUID()}`,
    entityType: 'alert',
    entityId: incidentId,
    action,
    actor: actor().email,
    timestamp: new Date().toISOString(),
    metadata,
  })
  try {
    const serialized = JSON.stringify(saved)
    if (serialized.length > 8_000_000) throw new Error('Workspace capacity reached')
    window.localStorage.setItem(key, serialized)
  } catch {
    throw new Error(
      'Browser storage is full or unavailable. The security workspace change was not saved.',
    )
  }
}
export async function getSecurityState() {
  return visible(read())
}
export function securityAudit() {
  return read().audit
}
function mutate<T>(action: () => T): Promise<T> {
  return window.navigator?.locks
    ? window.navigator.locks.request(key, action)
    : Promise.resolve().then(action)
}
export async function runAssessment(payload: { incidentId: string; intent: string }) {
  return mutate(() => {
    if (!['assess', 'response', 'handover'].includes(payload.intent))
      throw new Error('Invalid assessment intent.')
    const user = actor(),
      saved = read(),
      records = searchDataset({ q: '' })
    if (saved.runs.length >= 500)
      throw new Error('Assessment capacity reached. Archive records before continuing.')
    const context = buildContext(records, payload.incidentId, user.role)
    const run: EngineRun = {
      id: `run-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      actor: user.email,
      intent: payload.intent,
      question: '',
      provider: 'placeholder',
      model: 'YOLOv8n',
      context,
      assessment: validateAssessment(sampleAssessment(context, payload.intent), context),
      vision: placeholderVision(records, payload.incidentId),
    }
    saved.runs.unshift(run)
    write(saved, 'ENGINE_ASSESSED', payload.incidentId, {
      runId: run.id,
      provider: 'placeholder',
      model: 'YOLOv8n',
    })
    return run
  })
}
export async function proposeMission(runId: string) {
  return mutate(() => {
    const saved = read(),
      run = visible(saved).runs.find((item) => item.id === runId)
    if (!run) throw new Error('Assessment not found.')
    const existing = saved.missions.find((item) => item.runId === runId)
    if (existing) return existing
    if (
      saved.missions.some(
        (item) =>
          item.incidentId === run.context.incident.id &&
          ['pending-approval', 'active', 'paused'].includes(item.status),
      )
    )
      throw new Error(
        'An open mission already exists for this incident. Review or finish it before preparing another response.',
      )
    assertFreshRun(run, searchDataset({ q: '' }))
    if (saved.missions.length >= 500)
      throw new Error('Mission capacity reached. Archive records before continuing.')
    const mission = missionFromRun(
      run,
      actor().email,
      new Date().toISOString(),
      `mission-${crypto.randomUUID()}`,
    )
    saved.missions.unshift(mission)
    write(saved, 'MISSION_PROPOSED', mission.incidentId, { missionId: mission.id, runId })
    return mission
  })
}
export async function decideMission(
  id: string,
  decision: string,
  note: string,
  expectedRevision: number,
) {
  return mutate(() => {
    const user = actor(),
      saved = read()
    if (!['supervisor', 'admin'].includes(user.role))
      throw new Error('Supervisor approval is required.')
    const mission = visible(saved).missions.find((item) => item.id === id)
    if (!mission) throw new Error('Mission not found.')
    assertMissionRevision(mission, expectedRevision)
    if (decision === 'approve')
      assertFreshRun(
        saved.runs.find((run) => run.id === mission.runId)!,
        searchDataset({ q: '' }),
      )
    const updated = decide(mission, decision, note, user.email, new Date().toISOString())
    saved.missions[saved.missions.findIndex((item) => item.id === id)] = updated
    write(
      saved,
      decision === 'approve' ? 'MISSION_APPROVED' : 'MISSION_REJECTED',
      mission.incidentId,
      { missionId: id, runId: mission.runId },
    )
    return updated
  })
}
export async function completeMissionStep(
  id: string,
  stepId: string,
  note: string,
  expectedRevision: number,
) {
  return mutate(() => {
    const user = actor(),
      saved = read(),
      mission = visible(saved).missions.find((item) => item.id === id)
    if (!mission) throw new Error('Mission not found.')
    assertMissionRevision(mission, expectedRevision)
    const incident = searchDataset({ q: '' }).alerts.find((item) => item.id === mission.incidentId)
    if (!incident || ['closed', 'contained'].includes(incident.status))
      throw new Error('This incident is resolved. Mission progression is disabled.')
    const updated = complete(mission, stepId, note, user.email, new Date().toISOString())
    saved.missions[saved.missions.findIndex((item) => item.id === id)] = updated
    write(saved, 'MISSION_STEP_RECORDED', mission.incidentId, {
      missionId: id,
      runId: mission.runId,
      stepId,
    })
    return updated
  })
}
export async function coordinateMission(
  id: string,
  action: string,
  note: string,
  expectedRevision: number,
  team?: string,
) {
  return mutate(() => {
    const user = actor(),
      saved = read()
    if (!['supervisor', 'admin'].includes(user.role))
      throw new Error('Supervisor coordination is required.')
    const mission = visible(saved).missions.find((item) => item.id === id)
    if (!mission) throw new Error('Mission not found.')
    assertMissionRevision(mission, expectedRevision)
    if (action !== 'assign' && team !== undefined)
      throw new Error('Team applies only to assignment.')
    if (action === 'resume') {
      const incident = searchDataset({ q: '' }).alerts.find(
        (item) => item.id === mission.incidentId,
      )
      if (!incident || ['closed', 'contained'].includes(incident.status))
        throw new Error('This incident is resolved. Mission progression is disabled.')
    }
    const updated = coordinate(mission, action, note, user.email, new Date().toISOString(), team)
    saved.missions[saved.missions.findIndex((item) => item.id === id)] = updated
    write(saved, `MISSION_${updated.activity.at(-1)!.action.toUpperCase()}`, mission.incidentId, {
      missionId: id,
      revision: updated.revision,
      team: updated.assignedTeam,
    })
    return updated
  })
}
if (typeof window !== 'undefined') {
  const sync = (event: StorageEvent) => {
    if (event.key === key || event.key === null) window.dispatchEvent(new Event(OPERATIONS_CHANGED))
  }
  window.addEventListener('storage', sync)
  import.meta.hot?.dispose(() => window.removeEventListener('storage', sync))
}
