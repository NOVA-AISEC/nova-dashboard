const actions = [
  'proposed',
  'approved',
  'rejected',
  'step-recorded',
  'assigned',
  'paused',
  'resumed',
  'cancelled',
]
const noteText = (value, max = 2000) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

export function initializeMissionControl(mission, team) {
  return {
    ...mission,
    revision: 1,
    assignedTeam: team,
    activity: [
      {
        revision: 1,
        action: 'proposed',
        actor: mission.createdBy,
        at: mission.createdAt,
        note: 'Response procedure prepared for supervisor review.',
        team,
        stepId: '',
      },
    ],
  }
}

// Preserve earlier saved workflows and reconstruct only the events their records prove.
export function upgradeMissionControl(mission, team) {
  if (
    mission.revision !== undefined ||
    mission.activity !== undefined ||
    mission.assignedTeam !== undefined
  )
    return mission
  Object.assign(mission, initializeMissionControl(mission, team))
  if (mission.decisionBy) {
    mission.activity.push({
      revision: 2,
      action: mission.status === 'rejected' ? 'rejected' : 'approved',
      actor: mission.decisionBy,
      at: mission.decidedAt,
      note: mission.decisionNote,
      team: '',
      stepId: '',
    })
  }
  for (const step of mission.steps ?? [])
    if (step.status === 'completed')
      mission.activity.push({
        revision: mission.activity.length + 1,
        action: 'step-recorded',
        actor: step.completedBy,
        at: step.completedAt,
        note: step.note,
        team: '',
        stepId: step.id,
      })
  mission.revision = mission.activity.length
  return mission
}

export function recordMissionChange(
  previous,
  updated,
  action,
  note,
  actor,
  timestamp,
  { team = '', stepId = '' } = {},
) {
  if (
    previous.revision >= 200 ||
    (previous.revision === 199 && !['completed', 'rejected', 'cancelled'].includes(updated.status))
  )
    throw new Error(
      'Mission history capacity reached. Stop or decline this mission with a reason before preparing a new response.',
    )
  const revision = previous.revision + 1
  return {
    ...updated,
    revision,
    updatedAt: timestamp,
    activity: [
      ...previous.activity,
      { revision, action, note, actor, at: timestamp, team, stepId },
    ],
  }
}

export function assertMissionRevision(mission, expectedRevision) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)
    throw new Error('A valid mission revision is required.')
  if (mission.revision !== expectedRevision)
    throw new Error(
      'This mission changed since you opened it. Refresh and review the latest record before saving.',
    )
}

export function coordinateMission(mission, action, note, actor, timestamp, team = '') {
  if (!noteText(note)) throw new Error('Add a coordination note between 1 and 2000 characters.')
  const open = ['pending-approval', 'active', 'paused'].includes(mission.status)
  if (action === 'assign') {
    if (!open || !noteText(team, 100))
      throw new Error('Assign a responsible team to an open mission using 1–100 characters.')
    if (mission.assignedTeam === team.trim()) throw new Error('This team already owns the mission.')
    return recordMissionChange(
      mission,
      { ...mission, assignedTeam: team.trim() },
      'assigned',
      note.trim(),
      actor,
      timestamp,
      { team: team.trim() },
    )
  }
  const transitions = {
    pause: { from: ['active'], to: 'paused', event: 'paused' },
    resume: { from: ['paused'], to: 'active', event: 'resumed' },
    cancel: { from: ['active', 'paused'], to: 'cancelled', event: 'cancelled' },
  }
  const transition = ['pause', 'resume', 'cancel'].includes(action) ? transitions[action] : null
  if (!transition || !transition.from.includes(mission.status))
    throw new Error('This coordination action is not available for the current mission state.')
  return recordMissionChange(
    mission,
    { ...mission, status: transition.to },
    transition.event,
    note.trim(),
    actor,
    timestamp,
  )
}

export function validateMissionControl(mission) {
  if (
    !Number.isSafeInteger(mission.revision) ||
    mission.revision < 1 ||
    mission.revision > 200 ||
    !noteText(mission.assignedTeam, 100) ||
    !Array.isArray(mission.activity) ||
    mission.activity.length !== mission.revision
  )
    throw new Error('Invalid mission revision, ownership or history.')
  let status = '',
    team = '',
    stepIndex = 0,
    decision
  for (const [index, event] of mission.activity.entries()) {
    if (
      !event ||
      event.revision !== index + 1 ||
      !actions.includes(event.action) ||
      !noteText(event.actor, 254) ||
      !noteText(event.note) ||
      typeof event.at !== 'string' ||
      !Number.isFinite(Date.parse(event.at)) ||
      typeof event.team !== 'string' ||
      event.team.length > 100 ||
      typeof event.stepId !== 'string' ||
      event.stepId.length > 100
    )
      throw new Error('Invalid mission history event.')
    if (index && Date.parse(event.at) < Date.parse(mission.activity[index - 1].at))
      throw new Error('Mission history timestamps are out of order.')
    if (index === 0) {
      if (
        event.action !== 'proposed' ||
        event.actor !== mission.createdBy ||
        event.at !== mission.createdAt ||
        !noteText(event.team, 100) ||
        event.stepId
      )
        throw new Error('Invalid mission proposal history.')
      status = 'pending-approval'
      team = event.team
    } else if (event.action === 'approved' || event.action === 'rejected') {
      if (status !== 'pending-approval' || event.team || event.stepId)
        throw new Error('Invalid mission decision history.')
      status = event.action === 'approved' ? 'active' : 'rejected'
      decision = event
    } else if (event.action === 'step-recorded') {
      const step = mission.steps[stepIndex]
      if (
        status !== 'active' ||
        !step ||
        step.id !== event.stepId ||
        step.status !== 'completed' ||
        step.completedBy !== event.actor ||
        step.completedAt !== event.at ||
        step.note !== event.note ||
        event.team
      )
        throw new Error('Invalid mission outcome history.')
      stepIndex += 1
      if (stepIndex === mission.steps.length) status = 'completed'
    } else if (event.action === 'assigned') {
      if (
        !['pending-approval', 'active', 'paused'].includes(status) ||
        !noteText(event.team, 100) ||
        team === event.team ||
        event.stepId
      )
        throw new Error('Invalid mission assignment history.')
      team = event.team
    } else {
      const transitions = {
        paused: ['active', 'paused'],
        resumed: ['paused', 'active'],
        cancelled: ['active', 'cancelled'],
      }
      const transition =
        event.action === 'cancelled' && status === 'paused'
          ? ['paused', 'cancelled']
          : ['paused', 'resumed', 'cancelled'].includes(event.action)
            ? transitions[event.action]
            : null
      if (!transition || status !== transition[0] || event.team || event.stepId)
        throw new Error('Invalid mission coordination history.')
      status = transition[1]
    }
  }
  if (
    status !== mission.status ||
    team !== mission.assignedTeam ||
    stepIndex !== mission.steps.filter((step) => step.status === 'completed').length ||
    mission.updatedAt !== mission.activity.at(-1).at ||
    (decision &&
      (decision.actor !== mission.decisionBy ||
        decision.at !== mission.decidedAt ||
        decision.note !== mission.decisionNote))
  )
    throw new Error('Mission history does not match its current record.')
}
