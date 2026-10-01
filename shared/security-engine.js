// Provider-independent security workflow contract. No model can introduce executable tools.
import { placeholderVision, validateVisionFrame } from './vision-engine.js'
import {
  initializeMissionControl,
  upgradeMissionControl,
  recordMissionChange,
  validateMissionControl,
} from './mission-control.js'

export const playbooks = [
  {
    id: 'access-review',
    name: 'Access exception',
    category: 'Access & perimeter',
    description: 'Verify the access window, establish context, and coordinate a human review.',
    match: ['restricted-access-exception', 'tailgating', 'perimeter-intrusion'],
    keywords: /access|perimeter|fence|corridor|stairwell|thermal|tailgat/i,
    steps: [
      {
        id: 'verify-source',
        title: 'Verify the source',
        detail:
          'Compare camera, location and recorded time. Record mismatches before drawing a conclusion.',
        owner: 'Incident desk',
      },
      {
        id: 'request-check',
        title: 'Request a ground check',
        detail:
          'Contact the assigned team through the existing radio procedure and record their observations.',
        owner: 'Assigned response team',
      },
      {
        id: 'review-access',
        title: 'Review the access context',
        detail:
          'Ask the supervisor to check the approved access window or escort arrangements. Do not infer identity or intent.',
        owner: 'Security supervisor',
      },
      {
        id: 'record-outcome',
        title: 'Record the outcome',
        detail: 'Capture the decision, outstanding questions and the next shift owner.',
        owner: 'Incident desk',
      },
    ],
  },
  {
    id: 'item-review',
    name: 'Unattended item',
    category: 'Incident response',
    description: 'Separate an unattended observation from a confirmed security incident.',
    match: ['unattended-item', 'lost-property-intake'],
    keywords: /item|property|backpack/i,
    steps: [
      {
        id: 'verify-source',
        title: 'Verify the source',
        detail:
          'Review the snapshot location and timestamp. A detection is an observation awaiting human review.',
        owner: 'Incident desk',
      },
      {
        id: 'request-check',
        title: 'Request a ground check',
        detail:
          'Use the approved campus radio procedure to request a check by a trained team; this platform does not dispatch automatically.',
        owner: 'Assigned response team',
      },
      {
        id: 'classify-item',
        title: 'Confirm the incident classification',
        detail:
          'Have a trained operator distinguish normal lost property from an incident requiring the campus response procedure.',
        owner: 'Security supervisor',
      },
      {
        id: 'record-outcome',
        title: 'Record the outcome',
        detail: 'Document the human decision and carry unresolved context into handover.',
        owner: 'Incident desk',
      },
    ],
  },
  {
    id: 'flow-review',
    name: 'Campus flow',
    category: 'Mobility & events',
    description: 'Coordinate a review of crowd pressure, vehicle dwell or blocked access.',
    match: ['crowd-surge', 'parking-incident', 'vehicle-interest'],
    keywords: /crowd|queue|vehicle|parking|lane|courier|dwell/i,
    steps: [
      {
        id: 'verify-source',
        title: 'Verify the source',
        detail:
          'Check the recorded location, time and related snapshots before treating sample data as current conditions.',
        owner: 'Incident desk',
      },
      {
        id: 'request-check',
        title: 'Request a ground check',
        detail:
          'Ask the assigned team for current lane or crowd conditions through approved radio channels.',
        owner: 'Assigned response team',
      },
      {
        id: 'coordinate-flow',
        title: 'Coordinate a flow review',
        detail:
          'Have the supervisor agree any lane or event response with the campus team. No gate or access-control action is automated.',
        owner: 'Security supervisor',
      },
      {
        id: 'record-outcome',
        title: 'Record the outcome',
        detail: 'Log the human decision, ownership and any pending follow-up.',
        owner: 'Incident desk',
      },
    ],
  },
  {
    id: 'general-review',
    name: 'Human-led triage',
    category: 'Incident response',
    description: 'Establish a reliable source, an owner, and a documented next step.',
    match: [],
    keywords: /(?:)/,
    steps: [
      {
        id: 'verify-source',
        title: 'Verify the source',
        detail: 'Review the record and snapshot provenance; document missing context.',
        owner: 'Incident desk',
      },
      {
        id: 'request-check',
        title: 'Request a ground check',
        detail: 'Ask the assigned team for a current observation using approved campus procedures.',
        owner: 'Assigned response team',
      },
      {
        id: 'supervisor-review',
        title: 'Request supervisor review',
        detail: 'Ask the supervisor to assess uncertainty and determine the appropriate response.',
        owner: 'Security supervisor',
      },
      {
        id: 'record-outcome',
        title: 'Record the outcome',
        detail: 'Document the decision, owner and remaining follow-up for handover.',
        owner: 'Incident desk',
      },
    ],
  },
]

export function selectPlaybook(alert) {
  return playbooks.find(
    (item) =>
      item.match.includes(alert.category) || item.keywords.test(`${alert.title} ${alert.rule}`),
  )
}

export function buildContext(records, incidentId, role = 'supervisor') {
  const alert = records.alerts.find((item) => item.id === incidentId)
  if (!alert) throw new Error('Incident not found.')
  const evidence = records.evidence
    .filter((item) => alert.evidenceIds.includes(item.id))
    .slice(0, 20)
  const linkedCases =
    role === 'guard'
      ? []
      : records.cases
          .filter((item) => item.id === alert.caseId || item.alertIds.includes(alert.id))
          .slice(0, 5)
  const sources = [
    {
      id: alert.id,
      kind: 'alert',
      title: alert.title,
      detail: alert.summary,
      location: alert.zone,
      cameraId: alert.cameraId,
      recordedAt: alert.updatedAt,
    },
    ...evidence.map((item) => ({
      id: item.id,
      kind: 'evidence',
      title: item.title,
      detail: item.summary,
      location: item.metadata.zone,
      cameraId: item.metadata.cameraId,
      recordedAt: item.metadata.ts,
    })),
    ...linkedCases.map((item) => ({
      id: item.id,
      kind: 'case',
      title: item.title,
      detail: item.summary,
      location: item.location,
      cameraId: '',
      recordedAt: item.updatedAt,
    })),
  ]
  const gaps = [
    'Current conditions and intent are not verified by these records. Human review is required.',
  ]
  if (!evidence.length) gaps.push('No snapshot is linked to this incident.')
  if (evidence.some((item) => item.metadata.cameraId !== alert.cameraId))
    gaps.push(
      'A linked snapshot comes from a different camera. Verify its relationship to this incident.',
    )
  if (alert.evidenceIds.some((id) => !evidence.some((item) => item.id === id)))
    gaps.push('Some linked evidence is unavailable in this assessment.')
  if (alert.status === 'closed' || alert.status === 'contained')
    gaps.push(
      'This incident is resolved. New response missions are disabled until an operator reopens it through an approved workflow.',
    )
  const playbook = selectPlaybook(alert)
  return {
    caseContextIncluded: role !== 'guard',
    incident: {
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      status: alert.status,
      location: alert.zone,
      assignee: alert.assignee,
      recordedAt: alert.createdAt,
    },
    sources,
    gaps,
    playbookId: playbook.id,
  }
}

export function sampleAssessment(context, intent = 'assess') {
  const playbook = playbooks.find((item) => item.id === context.playbookId)
  return {
    summary:
      intent === 'handover'
        ? `Carry ${context.incident.title.toLowerCase()} into handover with ${context.incident.assignee}. The recorded state is ${context.incident.status}; confirm the current situation before acting.`
        : intent === 'response'
          ? `Review the ${playbook.name.toLowerCase()} procedure for ${context.incident.title.toLowerCase()}. Coordinate with ${context.incident.assignee} at ${context.incident.location}; supervisor approval is required before recording response outcomes.`
          : `${context.incident.title} is recorded as ${context.incident.severity} priority at ${context.incident.location}. Review the source and coordinate with ${context.incident.assignee} before deciding the response.`,
    observations: context.sources.map((source) => ({
      text: source.detail,
      sourceIds: [source.id],
    })),
    uncertainties: [...context.gaps],
    recommendedStepIds: playbook.steps.map((step) => step.id),
  }
}

export function validateAssessment(value, context) {
  const isText = (item, max = 5000) =>
    typeof item === 'string' && item.trim().length > 0 && item.length <= max
  const sourceIds = new Set(context.sources.map((item) => item.id))
  const allowedSteps = playbooks
    .find((item) => item.id === context.playbookId)
    .steps.map((item) => item.id)
  if (
    !value ||
    typeof value !== 'object' ||
    !isText(value.summary) ||
    !Array.isArray(value.observations) ||
    value.observations.length < 1 ||
    value.observations.length > 30 ||
    value.observations.some(
      (item) =>
        !item ||
        !isText(item.text) ||
        !Array.isArray(item.sourceIds) ||
        !item.sourceIds.length ||
        item.sourceIds.length > 25 ||
        item.sourceIds.some((id) => !sourceIds.has(id)),
    ) ||
    !Array.isArray(value.uncertainties) ||
    value.uncertainties.length > 15 ||
    value.uncertainties.some((item) => !isText(item, 1000)) ||
    !Array.isArray(value.recommendedStepIds) ||
    value.recommendedStepIds.length < 1 ||
    value.recommendedStepIds.length > allowedSteps.length ||
    new Set(value.recommendedStepIds).size !== value.recommendedStepIds.length ||
    value.recommendedStepIds.some((id) => !allowedSteps.includes(id))
  )
    throw new Error('The engine returned an invalid or ungrounded assessment.')
  // Workflow order is controlled by the catalog, not by model-generated ordering.
  const recommendedStepIds = allowedSteps.filter(
    (id) =>
      value.recommendedStepIds.includes(id) || id === 'verify-source' || id === 'record-outcome',
  )
  return {
    summary: value.summary.trim(),
    observations: value.observations.map((item) => ({
      text: item.text.trim(),
      sourceIds: [...new Set(item.sourceIds)],
    })),
    uncertainties: [...new Set([...context.gaps, ...value.uncertainties])],
    recommendedStepIds,
  }
}

export function contextVersion(context) {
  return JSON.stringify({
    incident: context.incident,
    sources: context.sources,
    playbookId: context.playbookId,
    caseContextIncluded: context.caseContextIncluded,
  })
}

export function missionFromRun(run, actor, timestamp, id) {
  const playbook = playbooks.find((item) => item.id === run.context.playbookId)
  return initializeMissionControl(
    {
      id,
      runId: run.id,
      incidentId: run.context.incident.id,
      title: run.context.incident.title,
      severity: run.context.incident.severity,
      location: run.context.incident.location,
      status: 'pending-approval',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: actor,
      playbookId: playbook.id,
      summary: run.assessment.summary,
      decisionBy: '',
      decisionNote: '',
      decidedAt: '',
      steps: playbook.steps
        .filter((step) => run.assessment.recommendedStepIds.includes(step.id))
        .map((step) => ({
          ...step,
          status: 'pending',
          completedBy: '',
          completedAt: '',
          note: '',
        })),
    },
    run.context.incident.assignee,
  )
}

export function assertFreshRun(run, records, now = Date.now()) {
  const role = run.context.caseContextIncluded ? 'supervisor' : 'guard'
  const current = buildContext(records, run.context.incident.id, role)
  if (['closed', 'contained'].includes(current.incident.status))
    throw new Error('This incident is resolved. A new response mission cannot proceed.')
  if (
    contextVersion(current) !== contextVersion(run.context) ||
    JSON.stringify(placeholderVision(records, run.context.incident.id)) !==
      JSON.stringify(run.vision) ||
    now - Date.parse(run.createdAt) > 15 * 60 * 1000 ||
    Date.parse(run.createdAt) > now
  )
    throw new Error(
      'This assessment has expired or its source records changed. Run a new assessment before proceeding.',
    )
}

// Persisted runs are immutable snapshots with bounded, validated source references.
export function validateSecurityRecords(value) {
  const text = (item, max = 5000) => typeof item === 'string' && item.length <= max
  const date = (item) => text(item, 100) && Number.isFinite(Date.parse(item))
  if (
    !value ||
    !Array.isArray(value.runs) ||
    !Array.isArray(value.missions) ||
    value.runs.length > 500 ||
    value.missions.length > 500
  )
    throw new Error('Invalid or oversized security workspace records.')
  const ids = new Set()
  for (const run of value.runs) {
    if (
      run?.context &&
      run.context.caseContextIncluded === undefined &&
      Array.isArray(run.context.sources)
    )
      run.context.caseContextIncluded = run.context.sources.some(
        (source) => source?.kind === 'case',
      )
    if (
      !run ||
      !text(run.id, 100) ||
      !run.id ||
      ids.has(run.id) ||
      !date(run.createdAt) ||
      !text(run.actor, 254) ||
      !run.actor ||
      !['assess', 'response', 'handover'].includes(run.intent) ||
      !text(run.question, 1000) ||
      run.provider !== 'placeholder' ||
      run.model !== 'YOLOv8n' ||
      !run.context?.incident ||
      typeof run.context.caseContextIncluded !== 'boolean' ||
      !date(run.context.incident.recordedAt) ||
      !['critical', 'high', 'medium', 'low'].includes(run.context.incident.severity) ||
      !['new', 'acknowledged', 'triaging', 'contained', 'closed'].includes(
        run.context.incident.status,
      ) ||
      !['id', 'title', 'severity', 'status', 'location', 'assignee', 'recordedAt'].every((key) =>
        text(run.context.incident[key]),
      ) ||
      !Array.isArray(run.context.sources) ||
      !run.context.sources.length ||
      run.context.sources.length > 26 ||
      !Array.isArray(run.context.gaps) ||
      run.context.gaps.length > 15 ||
      run.context.gaps.some((item) => !text(item, 1000)) ||
      !playbooks.some((item) => item.id === run.context.playbookId)
    )
      throw new Error('Invalid persisted assessment.')
    ids.add(run.id)
    const sources = new Set()
    for (const source of run.context.sources) {
      if (
        !source ||
        !['id', 'title', 'detail', 'location', 'cameraId'].every((key) => text(source[key])) ||
        !source.id ||
        sources.has(source.id) ||
        !['alert', 'case', 'evidence'].includes(source.kind) ||
        !date(source.recordedAt)
      )
        throw new Error('Invalid persisted assessment source.')
      if (!run.context.caseContextIncluded && source.kind === 'case')
        throw new Error('Case context is not allowed in this assessment.')
      sources.add(source.id)
    }
    const normalized = validateAssessment(run.assessment, run.context)
    if (
      JSON.stringify(normalized.recommendedStepIds) !==
        JSON.stringify(run.assessment.recommendedStepIds) ||
      run.context.gaps.some((gap) => !run.assessment.uncertainties.includes(gap))
    )
      throw new Error('Invalid persisted procedure order.')
    if (!Array.isArray(run.vision) || run.vision.length > 20)
      throw new Error('Invalid persisted vision frames.')
    for (const frame of run.vision) {
      if (
        !sources.has(frame.evidenceId) ||
        frame.provenance !== 'sample-metadata' ||
        frame.inferencePerformed !== false ||
        frame.model !== 'YOLOv8n' ||
        !text(frame.snapshotUrl, 2000)
      )
        throw new Error('Invalid placeholder provenance.')
      validateVisionFrame(frame)
    }
  }
  const missionIds = new Set(),
    runIds = new Set()
  for (const mission of value.missions) {
    const run = value.runs.find((item) => item.id === mission?.runId)
    if (mission && run) upgradeMissionControl(mission, run.context.incident.assignee)
    if (
      !mission ||
      !run ||
      !text(mission.id, 100) ||
      !mission.id ||
      missionIds.has(mission.id) ||
      runIds.has(mission.runId) ||
      !['pending-approval', 'active', 'paused', 'cancelled', 'rejected', 'completed'].includes(
        mission.status,
      ) ||
      ![
        'title',
        'location',
        'summary',
        'createdBy',
        'decisionBy',
        'decisionNote',
        'decidedAt',
      ].every((key) => text(mission[key])) ||
      !date(mission.createdAt) ||
      !date(mission.updatedAt) ||
      mission.incidentId !== run.context.incident.id ||
      mission.title !== run.context.incident.title ||
      mission.location !== run.context.incident.location ||
      mission.severity !== run.context.incident.severity ||
      mission.summary !== run.assessment.summary ||
      !text(mission.decisionNote, 2000) ||
      mission.playbookId !== run.context.playbookId ||
      !Array.isArray(mission.steps)
    )
      throw new Error('Invalid persisted mission.')
    missionIds.add(mission.id)
    runIds.add(mission.runId)
    const expected = missionFromRun(run, mission.createdBy, mission.createdAt, mission.id).steps
    if (expected.length !== mission.steps.length)
      throw new Error('Invalid persisted mission steps.')
    let pending = false
    for (const [index, step] of mission.steps.entries()) {
      if (
        !step ||
        !['id', 'title', 'detail', 'owner'].every((key) => step[key] === expected[index][key]) ||
        !['pending', 'completed'].includes(step.status) ||
        !['note', 'completedBy', 'completedAt'].every((key) => text(step[key], 2000))
      )
        throw new Error('Invalid persisted mission step.')
      if (step.status === 'pending') {
        pending = true
        if (step.completedAt || step.completedBy || step.note)
          throw new Error('Invalid pending step.')
      } else if (pending || !date(step.completedAt) || !step.completedBy || !step.note.trim())
        throw new Error('Invalid completed step order.')
    }
    if (
      mission.status === 'pending-approval' &&
      (mission.decisionBy ||
        mission.decidedAt ||
        mission.decisionNote ||
        mission.steps.some((step) => step.status !== 'pending'))
    )
      throw new Error('Invalid undecided mission.')
    if (
      mission.status !== 'pending-approval' &&
      (!date(mission.decidedAt) || !mission.decisionBy || !mission.decisionNote.trim())
    )
      throw new Error('Invalid mission decision.')
    if (
      (mission.status === 'completed' && pending) ||
      (['active', 'paused', 'cancelled'].includes(mission.status) && !pending) ||
      (mission.status === 'rejected' && mission.steps.some((step) => step.status !== 'pending'))
    )
      throw new Error('Invalid mission lifecycle.')
    validateMissionControl(mission)
    if (mission.activity[0].team !== run.context.incident.assignee)
      throw new Error('Invalid mission proposal ownership history.')
  }
  return value
}

export function decideMission(mission, decision, note, actor, timestamp) {
  if (mission.status !== 'pending-approval') throw new Error('This mission already has a decision.')
  if (
    !['approve', 'reject'].includes(decision) ||
    typeof note !== 'string' ||
    !note.trim() ||
    note.length > 2000
  )
    throw new Error('Add a decision note between 1 and 2000 characters.')
  return recordMissionChange(
    mission,
    {
      ...mission,
      status: decision === 'approve' ? 'active' : 'rejected',
      decisionBy: actor,
      decisionNote: note.trim(),
      decidedAt: timestamp,
      updatedAt: timestamp,
    },
    decision === 'approve' ? 'approved' : 'rejected',
    note.trim(),
    actor,
    timestamp,
  )
}

export function completeMissionStep(mission, stepId, note, actor, timestamp) {
  if (mission.status !== 'active') throw new Error('Only an approved active mission can progress.')
  const next = mission.steps.find((step) => step.status === 'pending')
  if (!next || next.id !== stepId)
    throw new Error('Complete the next pending step in procedure order.')
  if (typeof note !== 'string' || !note.trim() || note.length > 2000)
    throw new Error('Record an outcome between 1 and 2000 characters.')
  const steps = mission.steps.map((step) =>
    step.id === stepId
      ? {
          ...step,
          status: 'completed',
          note: note.trim(),
          completedBy: actor,
          completedAt: timestamp,
        }
      : step,
  )
  return recordMissionChange(
    mission,
    {
      ...mission,
      steps,
      status: steps.every((step) => step.status === 'completed') ? 'completed' : 'active',
      updatedAt: timestamp,
    },
    'step-recorded',
    note.trim(),
    actor,
    timestamp,
    { stepId },
  )
}
