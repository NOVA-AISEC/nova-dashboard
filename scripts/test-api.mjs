import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from '../server/app.js'
import { hashPassword } from '../server/auth.js'
import { atomicWrite, createDatabase } from '../server/db.js'
import { boundedInteger } from '../server/validation.js'
import { acquireDatabaseLock } from '../server/file-lock.js'
import { createAuth } from '../server/auth.js'

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-api-test-'))
const file = path.join(directory, 'db.json')
let failWrites = false
let time = Date.now()
let failures = 0
const database = createDatabase({
  dbFile: file,
  write: (target, state) => {
    if (failWrites) throw new Error('Private path or disk failure must not be exposed')
    atomicWrite(target, state)
  },
})
const original = database.initDb()
const password = 'Test-only-operator-42!'
const passwordHash = await hashPassword(password)
const users = ['guard', 'analyst', 'supervisor', 'admin'].map((role) => ({
  email: `${role}@test.local`,
  name: role,
  role,
  passwordHash,
}))
const origins = []
const app = createApp({
  database,
  users,
  origins,
  now: () => time,
  sessionMs: 60000,
  logger: {
    error: () => {
      failures += 1
    },
  },
})
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const base = `http://127.0.0.1:${server.address().port}`
// Configure the listener's exact origin before accepting any request.
// Rebuild with a known bound port, leaving the test process and database isolated.
await new Promise((resolve) => server.close(resolve))
const running = createApp({
  database,
  users,
  origins: [base],
  now: () => time,
  sessionMs: 60000,
  logger: {
    error: () => {
      failures += 1
    },
  },
}).listen(Number(new URL(base).port), '127.0.0.1')
await once(running, 'listening')
async function send(
  route,
  { method = 'GET', body, cookie, csrf, headers = {}, origin = base } = {},
) {
  const response = await fetch(`${base}/api${route}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { Origin: origin } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { 'X-Nova-CSRF': csrf } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
  const data = response.status === 204 ? null : await response.json()
  return { response, data, status: response.status }
}
async function login(role) {
  const result = await send('/auth/login', {
    method: 'POST',
    body: { email: `${role}@test.local`, password },
  })
  assert.equal(result.status, 200)
  const cookie = result.response.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Strict/)
  assert.ok(!('passwordHash' in result.data) && !('token' in result.data))
  return { cookie: cookie.split(';')[0], csrf: result.data.csrfToken }
}
try {
  const release = acquireDatabaseLock(file)
  assert.throws(() => acquireDatabaseLock(file), /already locked/)
  release()
  const releaseAgain = acquireDatabaseLock(file)
  releaseAgain()
  const lockedAuth = createAuth()
  await assert.rejects(lockedAuth.login({ body: {} }, {}), (error) => error.status === 503)
  let secureCookie
  const secureAuth = createAuth({ users, secureCookies: true })
  await secureAuth.login({ ip: 'test', headers: {}, body: { email: users[3].email, password } }, { setHeader: (_name, value) => { secureCookie = value }, json: () => {} })
  assert.match(secureCookie, /; Secure$/)
  const health = await send('/health')
  assert.equal(health.status, 200)
  assert.equal(health.response.headers.get('x-powered-by'), null)
  assert.equal(health.response.headers.get('cache-control'), 'no-store')
  assert.ok(health.response.headers.get('x-request-id'))
  assert.equal((await send('/alerts')).status, 401)
  assert.equal(
    (
      await send('/auth/login', {
        method: 'POST',
        origin: 'https://evil.example',
        body: { email: users[0].email, password },
      })
    ).status,
    403,
  )
  const reboundStatus = await new Promise((resolve, reject) => {
    const request = http.get(
      `${base}/api/health`,
      { headers: { Host: 'evil.example' } },
      (response) => {
        response.resume()
        resolve(response.statusCode)
      },
    )
    request.on('error', reject)
  })
  assert.equal(reboundStatus, 403)
  assert.equal((await send('/auth/login', { method: 'POST', body: '{' })).status, 400)
  assert.equal(
    (
      await send('/auth/login', {
        method: 'POST',
        body: { email: users[0].email, password, role: 'admin' },
      })
    ).status,
    400,
  )
  assert.equal(
    (
      await send('/auth/login', {
        method: 'POST',
        body: { email: users[0].email, password: 'incorrect' },
      })
    ).status,
    401,
  )
  const guard = await login('guard')
  const analyst = await login('analyst')
  const supervisor = await login('supervisor')
  assert.equal((await send('/audit', guard)).status, 403)
  assert.equal((await send(`/cases/${original.cases[0].id}`, guard)).status, 403)
  const guardSearch = await send('/search', guard)
  assert.deepEqual(guardSearch.data.cases, [])
  assert.deepEqual(guardSearch.data.audit, [])
  const alert = original.alerts.find((item) => item.status === 'new')
  assert.ok(alert)
  assert.equal((await send(`/alerts/${alert.id}/ack`, { ...analyst, method: 'POST' })).status, 403)
  assert.equal(
    (
      await send(`/alerts/${alert.id}/ack`, {
        cookie: guard.cookie,
        method: 'POST',
      })
    ).status,
    403,
  )
  assert.equal(
    (
      await send(`/alerts/${alert.id}/ack`, {
        cookie: guard.cookie,
        csrf: 'g'.repeat(64),
        method: 'POST',
      })
    ).status,
    403,
  )
  let auditCount = database.initDb().auditEvents.length
  assert.equal((await send(`/alerts/${alert.id}/ack`, { ...guard, method: 'POST' })).status, 200)
  assert.equal((await send(`/alerts/${alert.id}/ack`, { ...guard, method: 'POST' })).status, 200)
  assert.equal(database.initDb().auditEvents.length, auditCount + 1)
  assert.equal(database.initDb().auditEvents[0].actor, users[0].email)
  const reviewed = original.alerts.find(
    (item) => item.status === 'triaging' || item.status === 'closed',
  )
  assert.equal((await send(`/alerts/${reviewed.id}/ack`, { ...guard, method: 'POST' })).status, 409)
  assert.equal((await send('/alerts/missing/ack', { ...guard, method: 'POST' })).status, 404)
  for (const query of [
    'page=Infinity',
    'pageSize=1000',
    'page=1.5',
    'status=bogus',
    'q=a&q=b',
    'from=garbage',
    'from=2026-02-30',
    'from=2026-03-01&to=2026-01-01',
  ]) {
    assert.equal((await send(`/alerts?${query}`, supervisor)).status, 400, query)
  }
  const payload = {
    title: 'Standalone case',
    summary: 'No linked snapshots yet',
    location: 'Library',
    priority: 'priority-2',
    status: 'active',
    protocol: 'Review',
    leadAnalyst: 'Assigned operator',
  }
  for (const bad of [
    { ...payload, title: {} },
    { ...payload, title: '  ' },
    { ...payload, summary: 'x'.repeat(5001) },
    { ...payload, priority: 'urgent' },
    { ...payload, alertIds: ['missing'] },
    { ...payload, evidenceIds: 'bad' },
    { ...payload, actor: 'spoofed' },
  ]) {
    assert.equal((await send('/cases', { ...analyst, method: 'POST', body: bad })).status, 400)
  }
  assert.equal((await send('/cases', { ...guard, method: 'POST', body: payload })).status, 403)
  assert.equal(
    (
      await send('/cases', {
        ...analyst,
        method: 'POST',
        body: { ...payload, summary: 'x'.repeat(40000) },
      })
    ).status,
    413,
  )
  const created = await send('/cases', {
    ...analyst,
    method: 'POST',
    body: {
      ...payload,
      alertIds: [alert.id],
      evidenceIds: [original.evidence[0].id],
    },
  })
  assert.equal(created.status, 201)
  assert.equal(created.data.alerts[0].id, alert.id)
  assert.equal(created.data.evidence[0].id, original.evidence[0].id)
  assert.equal(created.data.audit[0].actor, users[1].email)
  const standalone = await send('/cases', {
    ...analyst,
    method: 'POST',
    body: payload,
  })
  assert.equal(standalone.status, 201)
  assert.ok(
    (await send('/search?q=Standalone', analyst)).data.cases.some(
      (item) => item.id === standalone.data.id,
    ),
  )
  const before = fs.readFileSync(file, 'utf8')
  const blockedDirectory = path.join(directory, 'blocked-target')
  fs.mkdirSync(blockedDirectory)
  assert.throws(() => atomicWrite(blockedDirectory, { test: true }))
  assert.ok(!fs.readdirSync(directory).some((name) => name.endsWith('.tmp')), 'failed rename cleans temporary files')
  const stateBefore = database.initDb()
  failWrites = true
  const failed = await send('/cases', {
    ...analyst,
    method: 'POST',
    body: payload,
  })
  assert.equal(failed.status, 503)
  assert.ok(!JSON.stringify(failed.data).includes('Private path'))
  assert.deepEqual(database.initDb(), stateBefore)
  assert.equal(fs.readFileSync(file, 'utf8'), before)
  const nextAlert = database.initDb().alerts.find((item) => item.status === 'new')
  assert.equal(
    (await send(`/alerts/${nextAlert.id}/ack`, { ...guard, method: 'POST' })).status,
    503,
  )
  assert.deepEqual(database.initDb(), stateBefore)
  failWrites = false
  assert.equal((await send('/cases', { ...supervisor, method: 'POST', body: payload })).status, 201)
  assert.ok(createDatabase({ dbFile: file }).getCaseById(standalone.data.id))
  fs.writeFileSync(path.join(directory, 'corrupt.json'), '{"broken":true}')
  assert.throws(
    () => createDatabase({ dbFile: path.join(directory, 'corrupt.json') }).initDb(),
    /Invalid database/,
  )
  const rotated = await send('/auth/login', {
    method: 'POST',
    cookie: supervisor.cookie,
    body: { email: users[2].email, password },
  })
  assert.equal(rotated.status, 200)
  assert.equal((await send('/auth/session', supervisor)).status, 401, 'login rotates prior cookie')
  assert.equal((await send('/auth/logout', { ...guard, method: 'POST' })).status, 204)
  assert.equal((await send('/auth/session', guard)).status, 401)
  time += 61000
  assert.equal((await send('/auth/session', analyst)).status, 401)
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal(
      (
        await send('/auth/login', {
          method: 'POST',
          body: { email: 'unknown@test.local', password },
        })
      ).status,
      401,
    )
  assert.equal(
    (
      await send('/auth/login', {
        method: 'POST',
        body: { email: 'unknown@test.local', password },
      })
    ).status,
    429,
  )
  assert.ok(failures >= 2)
  assert.throws(() => boundedInteger('0', 8000, 1000, 3600000, 'interval'), /integer/)
  console.log(
    'Passed: API authentication, roles, CSRF, expiry, rate limiting, input bounds, transitions, case search, durable saves, rollback and safe errors.',
  )
} finally {
  await new Promise((resolve) => running.close(resolve))
  fs.rmSync(directory, { recursive: true, force: true })
}
