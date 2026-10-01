import { randomUUID } from 'node:crypto'
import { ApiError, identifier } from './validation.js'
import {
  buildContext,
  assertFreshRun,
  sampleAssessment,
  validateAssessment,
  missionFromRun,
  decideMission,
  completeMissionStep,
} from '../shared/security-engine.js'
import { placeholderVision, visionEngineStatus } from '../shared/vision-engine.js'
import { assertMissionRevision, coordinateMission } from '../shared/mission-control.js'

export function createSecurityOS({ database, now = Date.now }) {
  const requestObject = (payload, keys) => {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      Object.keys(payload).some((key) => !keys.includes(key))
    )
      throw new ApiError(400, 'Invalid security workspace request.')
  }
  const fresh = (run) => {
    try {
      assertFreshRun(run, database.searchRecords(), now())
    } catch (error) {
      throw new ApiError(409, error.message, 'STALE_ASSESSMENT')
    }
  }
  const timestamp = () => new Date(now()).toISOString()
  const revision = (mission, value) => {
    if (!Number.isSafeInteger(value) || value < 1)
      throw new ApiError(400, 'A valid mission revision is required.')
    try {
      assertMissionRevision(mission, value)
    } catch (error) {
      throw new ApiError(409, error.message, 'STALE_MISSION')
    }
  }
  const view = (user) => {
    const state = database.securityState()
    const visibleRuns =
      user.role === 'guard'
        ? state.runs.filter((run) => run.actor === user.email && !run.context.caseContextIncluded)
        : state.runs
    const runIds = new Set(visibleRuns.map((run) => run.id))
    return {
      runs: visibleRuns,
      missions: state.missions.filter((mission) => runIds.has(mission.runId)),
      engine: visionEngineStatus,
    }
  }
  const activeIncident = (id) => {
    const incident = database.searchRecords().alerts.find((item) => item.id === id)
    if (!incident) throw new ApiError(404, 'Incident not found.', 'NOT_FOUND')
    if (['closed', 'contained'].includes(incident.status))
      throw new ApiError(
        409,
        'This incident is resolved. Review it through an approved reopening workflow before creating a response mission.',
        'RESOLVED_INCIDENT',
      )
  }
  return {
    state: view,
    assess(payload, user) {
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        Object.keys(payload).some((key) => !['incidentId', 'intent'].includes(key))
      )
        throw new ApiError(400, 'Invalid assessment request.')
      const incidentId = identifier(payload.incidentId)
      const intent = payload.intent ?? 'assess'
      if (!['assess', 'response', 'handover'].includes(intent))
        throw new ApiError(400, 'Invalid assessment intent.')
      const records = database.searchRecords()
      let context
      try {
        context = buildContext(records, incidentId, user.role)
      } catch {
        throw new ApiError(404, 'Incident not found.', 'NOT_FOUND')
      }
      const assessment = validateAssessment(sampleAssessment(context, intent), context)
      const run = {
        id: `run-${randomUUID()}`,
        createdAt: timestamp(),
        actor: user.email,
        intent,
        question: '',
        provider: 'placeholder',
        model: 'YOLOv8n',
        context,
        assessment,
        vision: placeholderVision(records, incidentId),
      }
      database.saveSecurityRun(run, user.email)
      return run
    },
    propose(payload, user) {
      requestObject(payload, ['runId'])
      const run = view(user).runs.find((item) => item.id === identifier(payload.runId))
      if (!run) throw new ApiError(404, 'Assessment not found.', 'NOT_FOUND')
      const existing = view(user).missions.find((item) => item.runId === run.id)
      if (existing) return existing
      if (
        database
          .securityState()
          .missions.some(
            (item) =>
              item.incidentId === run.context.incident.id &&
              ['pending-approval', 'active', 'paused'].includes(item.status),
          )
      )
        throw new ApiError(
          409,
          'An open mission already exists for this incident. Review or finish it before preparing another response.',
          'OPEN_MISSION_EXISTS',
        )
      fresh(run)
      return database.saveMission(
        missionFromRun(run, user.email, timestamp(), `mission-${randomUUID()}`),
        'MISSION_PROPOSED',
        user.email,
      )
    },
    decide(id, payload, user) {
      requestObject(payload, ['decision', 'note', 'expectedRevision'])
      if (!['supervisor', 'admin'].includes(user.role))
        throw new ApiError(403, 'Supervisor approval is required.', 'FORBIDDEN')
      const mission = view(user).missions.find((item) => item.id === identifier(id))
      if (!mission) throw new ApiError(404, 'Mission not found.', 'NOT_FOUND')
      revision(mission, payload.expectedRevision)
      if (payload.decision === 'approve')
        fresh(database.securityState().runs.find((run) => run.id === mission.runId))
      try {
        return database.saveMission(
          decideMission(mission, payload.decision, payload.note, user.email, timestamp()),
          payload.decision === 'approve' ? 'MISSION_APPROVED' : 'MISSION_REJECTED',
          user.email,
        )
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(409, error.message, 'INVALID_MISSION_DECISION')
      }
    },
    complete(id, stepId, payload, user) {
      requestObject(payload, ['note', 'expectedRevision'])
      const mission = view(user).missions.find((item) => item.id === identifier(id))
      if (!mission) throw new ApiError(404, 'Mission not found.', 'NOT_FOUND')
      revision(mission, payload.expectedRevision)
      activeIncident(mission.incidentId)
      try {
        return database.saveMission(
          completeMissionStep(mission, identifier(stepId), payload.note, user.email, timestamp()),
          'MISSION_STEP_RECORDED',
          user.email,
        )
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(409, error.message, 'INVALID_MISSION_STEP')
      }
    },
    coordinate(id, payload, user) {
      requestObject(payload, ['action', 'team', 'note', 'expectedRevision'])
      if (!['supervisor', 'admin'].includes(user.role))
        throw new ApiError(403, 'Supervisor coordination is required.', 'FORBIDDEN')
      const mission = view(user).missions.find((item) => item.id === identifier(id))
      if (!mission) throw new ApiError(404, 'Mission not found.', 'NOT_FOUND')
      revision(mission, payload.expectedRevision)
      if (payload.action === 'resume') activeIncident(mission.incidentId)
      if (payload.action !== 'assign' && payload.team !== undefined)
        throw new ApiError(400, 'Team applies only to assignment.')
      try {
        const updated = coordinateMission(
          mission,
          payload.action,
          payload.note,
          user.email,
          timestamp(),
          payload.team,
        )
        return database.saveMission(
          updated,
          `MISSION_${updated.activity.at(-1).action.toUpperCase()}`,
          user.email,
        )
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(409, error.message, 'INVALID_MISSION_COORDINATION')
      }
    },
  }
}
