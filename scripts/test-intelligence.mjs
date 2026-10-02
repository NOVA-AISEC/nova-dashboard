import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { createServer } from 'vite'
import {
  buildIntelligence,
  neighborhood,
  queryIntelligence,
} from '../shared/intelligence-engine.js'
import { createDatabase } from '../server/db.js'
import { createApp } from '../server/app.js'
import { hashPassword } from '../server/auth.js'

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-intelligence-'))
const database = createDatabase({ dbFile: path.join(directory, 'db.json') })
const users = ['guard', 'supervisor'].map((role) => ({
  role,
  email: `${role}@graph-test.local`,
  name: role,
}))
const records = structuredClone(database.searchRecords())
const incident = records.alerts[0],
  snapshot = records.evidence[0]
incident.evidenceIds = [snapshot.id, 'missing-snapshot']
snapshot.metadata.cameraId = 'MISMATCHED-CAMERA'
const caseRecord = records.cases[0]
caseRecord.alertIds = [incident.id]
incident.caseId = caseRecord.id
const state = { runs: [], missions: [], engine: {} }
const graph = buildIntelligence(records, state, users[1])
const anchor = `incident:${incident.id}`
const ids = new Set(graph.nodes.map((node) => node.id))
assert.equal(ids.size, graph.nodes.length)
assert.ok(
  graph.edges.every(
    (edge) =>
      ids.has(edge.source) &&
      ids.has(edge.target) &&
      edge.sourceIds.length &&
      edge.sourceIds.every((id) => ids.has(id)),
  ),
)
assert.ok(
  graph.edges.some(
    (edge) =>
      edge.source === anchor &&
      edge.target === `evidence:${snapshot.id}` &&
      edge.basis === 'Incident evidence ID reference',
  ),
)
assert.ok(
  graph.gaps.some((gap) => gap.title === 'Camera mismatch' && gap.sourceIds.includes(anchor)),
)
assert.ok(graph.gaps.some((gap) => gap.title === 'Linked evidence unavailable'))
assert.equal(graph.engine.inferenceConnected, false)
for (const mode of ['connections', 'evidence', 'gaps', 'timeline', 'response']) {
  const answer = queryIntelligence(graph, { question: 'Review this entity', nodeId: anchor, mode })
  assert.ok(
    answer.claims.every(
      (claim) => claim.sourceIds.length && claim.sourceIds.every((id) => ids.has(id)),
    ),
  )
  assert.ok(answer.claims.length <= 30)
}
const answer = queryIntelligence(graph, {
  question: 'What evidence supports this incident?',
  nodeId: anchor,
})
assert.equal(answer.status, 'answered')
assert.ok(answer.sourceIds.includes(`evidence:${snapshot.id}`))
assert.equal(
  queryIntelligence(graph, { question: 'Who committed this crime?', nodeId: anchor }).status,
  'unsupported',
)
assert.equal(
  queryIntelligence(graph, { question: 'Show evidence for nonexistent-zebra-42' }).status,
  'no-match',
)
assert.throws(
  () => queryIntelligence(graph, { question: 'Show evidence', nodeId: 'case:inaccessible' }),
  /visible workspace/,
)
for (const payload of [
  { question: '' },
  { question: 'x'.repeat(601) },
  { question: 'Show evidence', mode: 'execute' },
  { question: 'Show evidence', tools: ['unlock-gate'] },
  { question: 'Show evidence', nodeId: {} },
])
  assert.throws(() => queryIntelligence(graph, payload))
assert.throws(() => neighborhood(graph, anchor, 3))
assert.ok(
  neighborhood(graph, anchor, 2).nodes.length >= neighborhood(graph, anchor, 1).nodes.length,
)
const guardGraph = buildIntelligence(records, state, users[0])
assert.equal(
  guardGraph.nodes.some((node) => node.kind === 'case'),
  false,
)
assert.equal(
  guardGraph.edges.some(
    (edge) => edge.source.startsWith('case:') || edge.target.startsWith('case:'),
  ),
  false,
)
assert.throws(() => buildIntelligence(records, state, { email: 'forged', role: 'owner' }))
// Exact camera values link records; shared words and similar titles do not invent links.
const unrelated = {
  ...snapshot,
  id: 'unrelated-snapshot',
  metadata: { ...snapshot.metadata, cameraId: 'ISOLATED', zone: 'ISOLATED' },
}
const isolated = buildIntelligence(
  { ...records, evidence: [...records.evidence, unrelated] },
  state,
  users[1],
)
assert.ok(
  !queryIntelligence(isolated, { question: 'Show evidence', nodeId: anchor }).sourceIds.includes(
    'evidence:unrelated-snapshot',
  ),
)
const oversized = buildIntelligence(
  {
    ...records,
    alerts: Array.from({ length: 700 }, (_, index) => ({ ...incident, id: `bounded-${index}` })),
  },
  state,
  users[1],
)
assert.ok(
  oversized.omitted >= 100 && oversized.nodes.length <= 2000 && oversized.edges.length <= 6000,
)
assert.ok(
  oversized.gaps.every(
    (gap) =>
      gap.sourceIds.length &&
      gap.sourceIds.every((id) => oversized.nodes.some((node) => node.id === id)),
  ),
)
assert.ok(
  oversized.timeline.every(
    (entry) =>
      entry.sourceIds.length &&
      entry.sourceIds.every((id) => oversized.nodes.some((node) => node.id === id)),
  ),
)

let server, vite
const originalWindow = globalThis.window
const originalFetch = globalThis.fetch
try {
  const password = 'Graph-test-password-42!'
  const passwordHash = await hashPassword(password)
  const probe = createApp({ database, users: [], origins: [] }).listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  const base = `http://127.0.0.1:${port}`
  server = createApp({
    database,
    users: users.map((user) => ({ ...user, passwordHash })),
    origins: [base],
    logger: { error: () => {} },
  }).listen(port, '127.0.0.1')
  await once(server, 'listening')
  const send = async (route, { body, cookie, csrf } = {}) => {
    const response = await fetch(`${base}/api${route}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { Origin: base, 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { 'X-Nova-CSRF': csrf } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get('set-cookie')?.split(';')[0],
    }
  }
  assert.equal((await send('/intelligence')).status, 401)
  for (const user of users) {
    const login = await send('/auth/login', { body: { email: user.email, password } })
    assert.equal(login.status, 200)
    const view = await send('/intelligence', { cookie: login.cookie })
    assert.equal(view.status, 200)
    assert.equal(
      view.data.nodes.some((node) => node.kind === 'case'),
      user.role !== 'guard',
    )
    const query = {
      question: 'Show evidence',
      nodeId: `incident:${database.searchRecords().alerts[0].id}`,
    }
    assert.equal(
      (await send('/intelligence/query', { cookie: login.cookie, body: query })).status,
      403,
    )
    const result = await send('/intelligence/query', {
      cookie: login.cookie,
      csrf: login.data.csrfToken,
      body: query,
    })
    assert.equal(result.status, 200)
    const visibleIds = new Set(view.data.nodes.map((node) => node.id))
    assert.ok(result.data.sourceIds.every((id) => visibleIds.has(id)))
    assert.equal((await send('/intelligence?role=admin', { cookie: login.cookie })).status, 400)
    assert.equal(
      (
        await send('/intelligence/query', {
          cookie: login.cookie,
          csrf: login.data.csrfToken,
          body: { ...query, role: 'admin' },
        })
      ).status,
      400,
    )
    if (user.role === 'guard')
      assert.equal(
        (
          await send('/intelligence/query', {
            cookie: login.cookie,
            csrf: login.data.csrfToken,
            body: { ...query, nodeId: `case:${caseRecord.id}` },
          })
        ).status,
        400,
      )
  }
  const cache = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => cache.get(key) ?? null,
      setItem: (key, value) => cache.set(key, value),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  cache.set(
    'nova.session',
    JSON.stringify({ ...users[1], shift: 'Test', expiresAt: Date.now() + 60_000 }),
  )
  vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    define: { 'import.meta.env.VITE_USE_MOCK': JSON.stringify('true') },
  })
  const api = await vite.ssrLoadModule('/src/api/mock-client.ts')
  const mockGraph = await api.getIntelligence()
  assert.ok(mockGraph.nodes.some((node) => node.kind === 'case'))
  const mockAnswer = await api.askIntelligence({
    question: 'What evidence supports this incident?',
    nodeId: 'incident:alt-705',
  })
  assert.ok(mockAnswer.sourceIds.includes('evidence:ev-703'))
  cache.set(
    'nova.session',
    JSON.stringify({ ...users[0], shift: 'Test', expiresAt: Date.now() + 60_000 }),
  )
  assert.ok(!(await api.getIntelligence()).nodes.some((node) => node.kind === 'case'))
  cache.delete('nova.session')
  await assert.rejects(api.getIntelligence(), /Sign in/)
  console.log(
    'Passed: entity links, provenance, cited queries, mismatch/missing evidence, bounded graph, isolated context, HTTP auth/CSRF, role filtering and browser parity.',
  )
} finally {
  globalThis.window = originalWindow
  globalThis.fetch = originalFetch
  if (vite) await vite.close()
  if (server) await new Promise((resolve) => server.close(resolve))
  fs.rmSync(directory, { recursive: true, force: true })
}
