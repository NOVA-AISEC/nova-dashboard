import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { createServer } from 'vite'
import { createDatabase, atomicWrite } from '../server/db.js'
import { createApp } from '../server/app.js'
import { hashPassword } from '../server/auth.js'
import { createSecurityOS } from '../server/security-os.js'
import {
  buildContext,
  sampleAssessment,
  validateAssessment,
  validateSecurityRecords,
  playbooks,
} from '../shared/security-engine.js'
import { validateVisionFrame } from '../shared/vision-engine.js'
import { coordinateMission } from '../shared/mission-control.js'

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-security-os-'))
const file = path.join(directory, 'db.json')
let failWrite = false,
  now = Date.now()
const database = createDatabase({
  dbFile: file,
  write: (target, state) => {
    if (failWrite) throw new Error('Disk failed')
    atomicWrite(target, state)
  },
})
const records = database.searchRecords()
const incident = records.alerts.find((item) => item.status === 'new')
const context = buildContext(records, incident.id)
const raw = sampleAssessment(context)
assert.throws(
  () =>
    validateAssessment(
      { ...raw, observations: [{ text: 'Invented claim', sourceIds: ['unknown-source'] }] },
      context,
    ),
  /ungrounded/,
)
assert.throws(
  () => validateAssessment({ ...raw, recommendedStepIds: ['unlock-gate'] }, context),
  /ungrounded/,
)
assert.equal(
  buildContext(records, incident.id, 'guard').sources.some((source) => source.kind === 'case'),
  false,
)
assert.deepEqual(
  validateAssessment({ ...raw, recommendedStepIds: ['record-outcome'] }, context)
    .recommendedStepIds,
  ['verify-source', 'record-outcome'],
)
assert.throws(
  () =>
    validateVisionFrame({
      cameraId: 'CAM-1',
      recordedAt: new Date(now).toISOString(),
      detections: [
        { label: 'person', confidence: 0.9, bbox: { x: 0.8, y: 0, width: 0.5, height: 0.4 } },
      ],
    }),
  /bounding box/,
)
const engine = createSecurityOS({ database, now: () => now })
const guard = { email: 'guard@test.local', role: 'guard' },
  supervisor = { email: 'supervisor@test.local', role: 'supervisor' }
const run = engine.assess({ incidentId: incident.id, intent: 'assess' }, guard)
assert.equal(run.provider, 'placeholder')
assert.equal(run.model, 'YOLOv8n')
assert.ok(
  run.vision.every(
    (frame) => frame.inferencePerformed === false && frame.provenance === 'sample-metadata',
  ),
)
assert.equal(engine.state({ email: 'other@test.local', role: 'guard' }).runs.length, 0)
const mission = engine.propose({ runId: run.id }, guard)
const revision = (id) => database.securityState().missions.find((item) => item.id === id).revision
const payload = (id, note, extra = {}) => ({ note, expectedRevision: revision(id), ...extra })
assert.equal(engine.propose({ runId: run.id }, guard).id, mission.id, 'proposal is idempotent')
assert.throws(
  () => engine.complete(mission.id, mission.steps[0].id, payload(mission.id, 'checked'), guard),
  /approved active/,
)
assert.throws(
  () => engine.decide(mission.id, payload(mission.id, 'checked', { decision: 'approve' }), guard),
  (error) => error.status === 403,
)
assert.throws(
  () => engine.decide(mission.id, payload(mission.id, ' ', { decision: 'approve' }), supervisor),
  /decision note/,
)
failWrite = true
assert.throws(
  () =>
    engine.decide(mission.id, payload(mission.id, 'reviewed', { decision: 'approve' }), supervisor),
  (error) => error.code === 'STORAGE_UNAVAILABLE',
)
assert.equal(
  database.securityState().missions[0].status,
  'pending-approval',
  'failed decision rolls back',
)
failWrite = false
engine.decide(
  mission.id,
  payload(mission.id, 'Procedure reviewed against source records.', { decision: 'approve' }),
  supervisor,
)
assert.throws(
  () => engine.complete(mission.id, mission.steps[1].id, payload(mission.id, 'skip'), guard),
  /procedure order/,
)
for (const step of mission.steps)
  engine.complete(mission.id, step.id, payload(mission.id, 'Test observation recorded.'), guard)
assert.equal(database.securityState().missions[0].status, 'completed')
assert.throws(
  () => engine.complete(mission.id, mission.steps[0].id, payload(mission.id, 'again'), guard),
  /approved active/,
)
assert.equal(
  createDatabase({ dbFile: file }).securityState().missions[0].status,
  'completed',
  'mission survives restart',
)
const corrupt = structuredClone(database.securityState())
corrupt.missions[0].steps[0].detail = 'Execute an injected command'
assert.throws(() => validateSecurityRecords(corrupt), /mission step/)
const historical = structuredClone(database.securityState())
delete historical.missions[0].revision
delete historical.missions[0].assignedTeam
delete historical.missions[0].activity
validateSecurityRecords(historical)
assert.equal(
  historical.missions[0].activity.length,
  mission.steps.length + 2,
  'older records migrate using proved outcomes',
)
const tampered = structuredClone(database.securityState())
tampered.missions[0].activity[1].note = 'An unrecorded decision'
assert.throws(() => validateSecurityRecords(tampered), /history/)
const incompleteHistory = structuredClone(database.securityState())
delete incompleteHistory.missions[0].revision
delete incompleteHistory.missions[0].activity
assert.throws(() => validateSecurityRecords(incompleteHistory), /history/)
const inventedOwner = structuredClone(historical)
inventedOwner.missions[0].activity[0].team = inventedOwner.missions[0].assignedTeam =
  'Unrecorded team'
assert.throws(() => validateSecurityRecords(inventedOwner), /ownership history/)
let full = structuredClone(database.securityState().missions[0])
// Use an approved procedure with pending steps to verify the final history slot stays usable.
full.steps.forEach((step) =>
  Object.assign(step, { status: 'pending', completedBy: '', completedAt: '', note: '' }),
)
full.status = 'active'
full.activity = full.activity.slice(0, 2)
full.revision = 2
full.updatedAt = full.activity.at(-1).at
for (let index = 2; index < 199; index++)
  full = coordinateMission(
    full,
    'assign',
    'Capacity test handover.',
    supervisor.email,
    full.updatedAt,
    `Test team ${index}`,
  )
validateSecurityRecords({ runs: [run], missions: [full] })
assert.throws(
  () => coordinateMission(full, 'pause', 'Capacity test.', supervisor.email, full.updatedAt),
  /history capacity/,
)
full = coordinateMission(
  full,
  'cancel',
  'Capacity test: stop with record preserved.',
  supervisor.email,
  full.updatedAt,
)
validateSecurityRecords({ runs: [run], missions: [full] })
assert.equal(full.revision, 200)
assert.equal(full.status, 'cancelled')
const stale = engine.assess({ incidentId: incident.id }, supervisor)
assert.equal(
  engine.state({ email: supervisor.email, role: 'guard' }).runs.length,
  0,
  'a downgraded operator cannot view earlier case context',
)
const pending = engine.propose({ runId: stale.id }, supervisor)
const duplicateRun = engine.assess({ incidentId: incident.id }, supervisor)
assert.throws(
  () => engine.propose({ runId: duplicateRun.id }, supervisor),
  (error) => error.code === 'OPEN_MISSION_EXISTS',
)
assert.throws(
  () =>
    engine.coordinate(
      pending.id,
      payload(pending.id, 'Handover.', { action: 'assign', team: 'Campus Response' }),
      guard,
    ),
  (error) => error.status === 403,
)
assert.throws(
  () =>
    engine.coordinate(
      pending.id,
      { action: 'assign', team: 'Campus Response', note: 'Handover.' },
      supervisor,
    ),
  (error) => error.status === 400,
)
engine.coordinate(
  pending.id,
  payload(pending.id, 'Source verification assigned.', {
    action: 'assign',
    team: 'Campus Response',
  }),
  supervisor,
)
assert.throws(
  () =>
    engine.decide(
      pending.id,
      { decision: 'approve', note: 'Old view.', expectedRevision: 1 },
      supervisor,
    ),
  (error) => error.code === 'STALE_MISSION',
)
now += 16 * 60 * 1000
assert.throws(
  () =>
    engine.decide(pending.id, payload(pending.id, 'reviewed', { decision: 'approve' }), supervisor),
  (error) => error.code === 'STALE_ASSESSMENT',
)
engine.decide(
  pending.id,
  payload(pending.id, 'Expired. Reassess.', { decision: 'reject' }),
  supervisor,
)
const changed = engine.assess({ incidentId: incident.id }, supervisor)
const changedVision = structuredClone(records)
changedVision.evidence.find(
  (item) => item.id === changed.vision[0].evidenceId,
).detections[0].confidence = 0.5
const { assertFreshRun } = await import('../shared/security-engine.js')
assert.throws(() => assertFreshRun(changed, changedVision, now), /source records changed/)
database.ackAlert(incident.id, supervisor.email)
assert.throws(
  () => engine.propose({ runId: changed.id }, supervisor),
  (error) => error.code === 'STALE_ASSESSMENT',
)
assert.ok(
  database
    .listAuditEvents({ pageSize: 100 })
    .items.some((event) => event.action === 'MISSION_APPROVED' && event.actor === supervisor.email),
)
const resolved = records.alerts.find((item) => ['closed', 'contained'].includes(item.status))
const resolvedRun = engine.assess({ incidentId: resolved.id }, supervisor)
assert.throws(() => engine.propose({ runId: resolvedRun.id }, supervisor), /resolved/)

// Exercise the actual HTTP boundaries rather than only invoking the service.
const password = 'Security-OS-test-only-42!'
const passwordHash = await hashPassword(password)
const users = [guard, supervisor].map((user) => ({ ...user, name: user.role, passwordHash }))
const probe = createApp({ database }).listen(0, '127.0.0.1')
await once(probe, 'listening')
const port = probe.address().port,
  base = `http://127.0.0.1:${port}`
await new Promise((resolve) => probe.close(resolve))
const httpServer = createApp({ database, users, origins: [base], logger: { error() {} } }).listen(
  port,
  '127.0.0.1',
)
await once(httpServer, 'listening')
async function send(route, user, body) {
  const response = await fetch(`${base}/api${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(user ? { Cookie: user.cookie, 'X-Nova-CSRF': user.csrf } : {}),
      ...(body === undefined ? {} : { Origin: base, 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { response, status: response.status, data: await response.json() }
}
async function login(user) {
  const result = await send('/auth/login', null, { email: user.email, password })
  assert.equal(result.status, 200)
  return {
    cookie: result.response.headers.get('set-cookie').split(';')[0],
    csrf: result.data.csrfToken,
  }
}
try {
  assert.equal((await send('/security')).status, 401)
  const guardSession = await login(guard),
    supervisorSession = await login(supervisor)
  assert.equal(
    (
      await send(
        '/security/assessments',
        { ...guardSession, csrf: 'bad' },
        { incidentId: incident.id },
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await send('/security/assessments', guardSession, {
        incidentId: incident.id,
        provider: 'cloud',
      })
    ).status,
    400,
  )
  const assessment = await send('/security/assessments', guardSession, {
    incidentId: incident.id,
    intent: 'response',
  })
  assert.equal(assessment.status, 201)
  const proposed = await send('/security/missions', guardSession, { runId: assessment.data.id })
  assert.equal(proposed.status, 200)
  assert.equal(
    (
      await send(`/security/missions/${proposed.data.id}/decision`, guardSession, {
        decision: 'approve',
        note: 'attempt',
        expectedRevision: proposed.data.revision,
      })
    ).status,
    403,
  )
  assert.equal(
    (
      await send(`/security/missions/${proposed.data.id}/decision`, supervisorSession, {
        decision: 'approve',
        note: 'Review approved for test workflow.',
        expectedRevision: proposed.data.revision,
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await send(
        `/security/missions/${proposed.data.id}/steps/${proposed.data.steps[0].id}`,
        guardSession,
        payload(proposed.data.id, 'Source verified by test operator.'),
      )
    ).status,
    200,
  )
  assert.equal((await send('/security', guardSession)).data.engine.inferenceConnected, false)
  const route = `/security/missions/${proposed.data.id}/coordination`
  assert.equal(
    (await send(route, guardSession, payload(proposed.data.id, 'Hold.', { action: 'pause' })))
      .status,
    403,
  )
  assert.equal(
    (
      await send(
        route,
        { ...supervisorSession, csrf: 'bad' },
        payload(proposed.data.id, 'Hold.', { action: 'pause' }),
      )
    ).status,
    403,
  )
  const beforeHold = revision(proposed.data.id)
  assert.equal(
    (
      await send(
        route,
        supervisorSession,
        payload(proposed.data.id, 'Waiting for a source check.', { action: 'pause' }),
      )
    ).status,
    200,
  )
  const staleUpdate = await send(route, supervisorSession, {
    action: 'assign',
    team: 'Another team',
    note: 'Outdated handover.',
    expectedRevision: beforeHold,
  })
  assert.equal(staleUpdate.status, 409)
  assert.equal(staleUpdate.data.code, 'STALE_MISSION')
  assert.equal(
    (
      await send(
        `/security/missions/${proposed.data.id}/steps/${proposed.data.steps[1].id}`,
        guardSession,
        payload(proposed.data.id, 'Blocked while held.'),
      )
    ).status,
    409,
  )
  failWrite = true
  assert.equal(
    (
      await send(
        route,
        supervisorSession,
        payload(proposed.data.id, 'Source checked.', { action: 'resume' }),
      )
    ).status,
    503,
  )
  failWrite = false
  assert.equal(
    database.securityState().missions.find((item) => item.id === proposed.data.id).status,
    'paused',
  )
  assert.equal(
    (
      await send(
        route,
        supervisorSession,
        payload(proposed.data.id, 'Source checked.', { action: 'resume' }),
      )
    ).status,
    200,
  )
  assert.equal(
    (
      await send(
        route,
        supervisorSession,
        payload(proposed.data.id, 'Response transferred through campus channels.', {
          action: 'cancel',
        }),
      )
    ).status,
    200,
  )
  assert.equal(
    (
      await send(
        route,
        supervisorSession,
        payload(proposed.data.id, 'Attempt to reopen.', { action: 'resume' }),
      )
    ).status,
    409,
  )
  const stopped = createDatabase({ dbFile: file })
    .securityState()
    .missions.find((item) => item.id === proposed.data.id)
  assert.equal(stopped.status, 'cancelled')
  assert.equal(stopped.steps.filter((step) => step.status === 'completed').length, 1)
  assert.equal(stopped.activity.at(-1).action, 'cancelled')
} finally {
  await new Promise((resolve) => httpServer.close(resolve))
}

// The browser sample adapter must enforce the same lifecycle and preserve failed saves.
const cache = new Map(),
  windowStub = new EventTarget()
let lockQueue = Promise.resolve(),
  lockRequests = 0
windowStub.navigator = {
  locks: {
    request: (name, action) => {
      assert.equal(name, 'nova.security-os.v1')
      lockRequests += 1
      const acquired = lockQueue.then(action)
      lockQueue = acquired.catch(() => {})
      return acquired
    },
  },
}
let storageFails = false
windowStub.localStorage = {
  getItem: (key) => cache.get(key) ?? null,
  setItem: (key, value) => {
    if (storageFails) throw new Error('quota')
    cache.set(key, value)
  },
  removeItem: (key) => cache.delete(key),
}
windowStub.setTimeout = () => 0
const oldWindow = globalThis.window
globalThis.window = windowStub
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
const session = (user) =>
  cache.set(
    'nova.session',
    JSON.stringify({ ...user, name: user.role, shift: 'Test', expiresAt: Date.now() + 60000 }),
  )
try {
  const api = await vite.ssrLoadModule('/src/api/mock-client.ts')
  session(supervisor)
  const mockIncident = api.alerts.find((item) => item.id === 'alt-705')
  const mockRun = await api.runAssessment({ incidentId: mockIncident.id, intent: 'assess' })
  assert.ok(mockRun.assessment.uncertainties.some((item) => /different camera/.test(item)))
  const mockMission = await api.proposeMission(mockRun.id)
  const before = cache.get('nova.security-os.v1')
  storageFails = true
  await assert.rejects(
    api.decideMission(mockMission.id, 'approve', 'Reviewed.', mockMission.revision),
    /not saved/,
  )
  assert.equal(cache.get('nova.security-os.v1'), before)
  storageFails = false
  const concurrent = await Promise.allSettled([
    api.decideMission(mockMission.id, 'approve', 'Reviewed.', mockMission.revision),
    api.decideMission(
      mockMission.id,
      'reject',
      'Competing outdated decision.',
      mockMission.revision,
    ),
  ])
  assert.equal(concurrent.filter((item) => item.status === 'fulfilled').length, 1)
  assert.match(
    concurrent.find((item) => item.status === 'rejected').reason.message,
    /mission changed/,
  )
  const mockRevision = async () =>
    (await api.getSecurityState()).missions.find((item) => item.id === mockMission.id).revision
  await api.coordinateMission(
    mockMission.id,
    'assign',
    'Next shift to verify source.',
    await mockRevision(),
    'Campus Response',
  )
  const held = await api.coordinateMission(
    mockMission.id,
    'pause',
    'Awaiting source verification.',
    await mockRevision(),
  )
  await assert.rejects(
    api.completeMissionStep(mockMission.id, mockMission.steps[0].id, 'Blocked.', held.revision),
    /approved active/,
  )
  await api.coordinateMission(mockMission.id, 'resume', 'Source check available.', held.revision)
  for (const step of mockMission.steps)
    await api.completeMissionStep(
      mockMission.id,
      step.id,
      'Verified test outcome.',
      await mockRevision(),
    )
  assert.equal((await api.getSecurityState()).missions[0].status, 'completed')
  assert.ok(
    (await api.listAudit({ pageSize: 100 })).items.some(
      (event) => event.action === 'MISSION_STEP_RECORDED',
    ),
  )
  session(guard)
  assert.equal((await api.getSecurityState()).runs.length, 0)
  await assert.rejects(
    api.decideMission(mockMission.id, 'approve', 'Attempt', 1),
    /Supervisor approval/,
  )
  await assert.rejects(
    api.coordinateMission(mockMission.id, 'assign', 'Attempt.', 1, 'Guard Team'),
    /Supervisor coordination/,
  )
  session(supervisor)
  const completed = (await api.getSecurityState()).missions[0]
  const brief = await vite.ssrLoadModule('/src/lib/mission-brief.ts')
  const hostile = structuredClone(completed)
  hostile.assignedTeam = '<script>alert("team")</script>'
  hostile.activity.at(-1).note = '<img src=x onerror=alert(1)>'
  const handover = brief.buildMissionBrief(hostile, mockRun, 'operator<script>')
  assert.ok(handover.includes('&lt;script&gt;alert(&quot;team&quot;)&lt;/script&gt;'))
  assert.ok(!handover.includes('<script>') && !handover.includes('<img'))
  assert.ok(handover.includes('YOLOv8n placeholder') && handover.includes('Mission history'))
  assert.ok(lockRequests >= 10, 'sample mutations use the shared Web Lock')
  cache.set('nova.security-os.v1', '{"version":1,"runs":[],"missions":[{}],"audit":[]}')
  await assert.rejects(api.getSecurityState(), /invalid/)
  assert.equal(playbooks.length, 4)
} finally {
  globalThis.window = oldWindow
  await vite.close()
  fs.rmSync(directory, { recursive: true, force: true })
}
console.log(
  'Passed: grounding, YOLO placeholder provenance, roles/CSRF, ordered outcomes, duplicate prevention, conflicting revisions, hold/resume/stop, atomic rollback, restart, legacy history, history bounds/tampering, competing decisions and escaped handovers.',
)
