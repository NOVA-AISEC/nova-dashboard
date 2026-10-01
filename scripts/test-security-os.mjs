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
assert.equal(engine.propose({ runId: run.id }, guard).id, mission.id, 'proposal is idempotent')
assert.throws(
  () => engine.complete(mission.id, mission.steps[0].id, { note: 'checked' }, guard),
  /approved active/,
)
assert.throws(
  () => engine.decide(mission.id, { decision: 'approve', note: 'checked' }, guard),
  (error) => error.status === 403,
)
assert.throws(
  () => engine.decide(mission.id, { decision: 'approve', note: ' ' }, supervisor),
  /decision note/,
)
failWrite = true
assert.throws(
  () => engine.decide(mission.id, { decision: 'approve', note: 'reviewed' }, supervisor),
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
  { decision: 'approve', note: 'Procedure reviewed against source records.' },
  supervisor,
)
assert.throws(
  () => engine.complete(mission.id, mission.steps[1].id, { note: 'skip' }, guard),
  /procedure order/,
)
for (const step of mission.steps)
  engine.complete(mission.id, step.id, { note: 'Test observation recorded.' }, guard)
assert.equal(database.securityState().missions[0].status, 'completed')
assert.throws(
  () => engine.complete(mission.id, mission.steps[0].id, { note: 'again' }, guard),
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
const stale = engine.assess({ incidentId: incident.id }, supervisor)
assert.equal(
  engine.state({ email: supervisor.email, role: 'guard' }).runs.length,
  0,
  'a downgraded operator cannot view earlier case context',
)
const pending = engine.propose({ runId: stale.id }, supervisor)
now += 16 * 60 * 1000
assert.throws(
  () => engine.decide(pending.id, { decision: 'approve', note: 'reviewed' }, supervisor),
  (error) => error.code === 'STALE_ASSESSMENT',
)
engine.decide(pending.id, { decision: 'reject', note: 'Expired. Reassess.' }, supervisor)
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
      })
    ).status,
    403,
  )
  assert.equal(
    (
      await send(`/security/missions/${proposed.data.id}/decision`, supervisorSession, {
        decision: 'approve',
        note: 'Review approved for test workflow.',
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await send(
        `/security/missions/${proposed.data.id}/steps/${proposed.data.steps[0].id}`,
        guardSession,
        { note: 'Source verified by test operator.' },
      )
    ).status,
    200,
  )
  assert.equal((await send('/security', guardSession)).data.engine.inferenceConnected, false)
} finally {
  await new Promise((resolve) => httpServer.close(resolve))
}

// The browser sample adapter must enforce the same lifecycle and preserve failed saves.
const cache = new Map(),
  windowStub = new EventTarget()
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
  await assert.rejects(api.decideMission(mockMission.id, 'approve', 'Reviewed.'), /not saved/)
  assert.equal(cache.get('nova.security-os.v1'), before)
  storageFails = false
  await api.decideMission(mockMission.id, 'approve', 'Reviewed.')
  for (const step of mockMission.steps)
    await api.completeMissionStep(mockMission.id, step.id, 'Verified test outcome.')
  assert.equal((await api.getSecurityState()).missions[0].status, 'completed')
  assert.ok(
    (await api.listAudit({ pageSize: 100 })).items.some(
      (event) => event.action === 'MISSION_STEP_RECORDED',
    ),
  )
  session(guard)
  assert.equal((await api.getSecurityState()).runs.length, 0)
  await assert.rejects(
    api.decideMission(mockMission.id, 'approve', 'Attempt'),
    /Supervisor approval/,
  )
  cache.set('nova.security-os.v1', '{"version":1,"runs":[],"missions":[{}],"audit":[]}')
  await assert.rejects(api.getSecurityState(), /invalid/)
  assert.equal(playbooks.length, 4)
} finally {
  globalThis.window = oldWindow
  await vite.close()
  fs.rmSync(directory, { recursive: true, force: true })
}
console.log(
  'Passed: source grounding, YOLO placeholder provenance, vision bounds, approval roles, mission order, expiry, changed sources, HTTP security, atomic rollback, restart, sample persistence and activity history.',
)
