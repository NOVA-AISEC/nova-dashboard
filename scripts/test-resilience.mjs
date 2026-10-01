import assert from 'node:assert/strict'
import { createServer } from 'vite'
const originalWindow = globalThis.window
const originalFetch = globalThis.fetch
const cache = new Map()
let timeout
const windowStub = new EventTarget()
windowStub.localStorage = { getItem: (key) => cache.get(key) ?? null }
windowStub.setTimeout = (callback) => {
  timeout = callback
  return 1
}
windowStub.clearTimeout = () => {}
globalThis.window = windowStub
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
try {
  const sessions = await server.ssrLoadModule('/src/lib/session.ts')
  const transport = await server.ssrLoadModule('/src/api/transport.ts')
  const http = await server.ssrLoadModule('/src/api/client.ts')
  const storage = await server.ssrLoadModule('/src/lib/operator-storage.ts')
  const theme = await server.ssrLoadModule('/src/theme/strathmore.ts')
  const persistence = await server.ssrLoadModule('/src/lib/mock-persistence.ts')
  const api = await server.ssrLoadModule('/src/api/mock-client.ts')
  const session = {
    name: 'QA',
    email: 'qa@test.local',
    shift: 'Test shift',
    role: 'supervisor',
    expiresAt: Date.now() + 10000,
  }
  cache.set(sessions.SESSION_STORAGE_KEY, JSON.stringify(session))
  assert.equal(sessions.readDemoSession().role, 'supervisor')
  for (const bad of [
    null,
    [],
    { ...session, role: 'owner' },
    { ...session, expiresAt: Date.now() - 1 },
    { ...session, expiresAt: Date.now() + 48 * 3600000 },
    { ...session, name: {} },
  ])
    assert.equal(sessions.validSession(bad), false)
  for (const path of [
    '//evil.test',
    '/\\evil.test',
    'https://evil.test',
    '/cases/%2f%2fevil',
    '/login',
    '/users',
    '/cases/case-1',
  ])
    assert.equal(sessions.safeReturnRoute(path, 'guard'), '/command')
  assert.equal(sessions.safeReturnRoute('/cases/case-1', 'analyst'), '/cases/case-1')
  let expired = 0
  windowStub.addEventListener(transport.SESSION_EXPIRED, () => expired++)
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Sign in again', code: 'UNAUTHENTICATED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  await assert.rejects(transport.request('/api/alerts'), /Sign in again/)
  assert.equal(expired, 1)
  await assert.rejects(transport.request('/api/auth/login', {}, false), /Sign in again/)
  assert.equal(expired, 1)
  globalThis.fetch = async () =>
    new Response('<script>private proxy HTML</script>', {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    })
  await assert.rejects(transport.request('/api/alerts'), /Request failed \(502\)/)
  globalThis.fetch = async () =>
    new Response('bad json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  await assert.rejects(transport.request('/api/alerts'), /unexpected response/)
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch')
  }
  await assert.rejects(transport.request('/api/alerts'), /Unable to reach/)
  globalThis.fetch = (_path, init) =>
    new Promise((_resolve, reject) =>
      init.signal.addEventListener('abort', () => reject(new Error('AbortError'))),
    )
  const pending = transport.request('/api/alerts')
  timeout()
  await assert.rejects(pending, /timed out/)
  let requestedPath, options
  globalThis.fetch = async (path, init) => {
    requestedPath = path
    options = init
    return new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  transport.setCsrfToken('session-csrf')
  await http.ackAlert('a/b?c')
  assert.equal(requestedPath, '/api/alerts/a%2Fb%3Fc/ack')
  assert.equal(options.headers.get('X-Nova-CSRF'), 'session-csrf')
  assert.equal(options.credentials, 'same-origin')
  cache.set('dama-sentinel.preferences', JSON.stringify({ defaultZone: 'Unknown' }))
  assert.equal(storage.readOperatorPreferences().defaultZone, 'Main Gate  Lane 1')
  cache.set(
    'dama-sentinel.incident-reports',
    JSON.stringify([
      {
        id: '1',
        reporter: 'QA',
        category: 'unattended-item',
        zone: 'Library Entrance',
        priority: 'urgent',
        summary: 'Test',
        createdAt: 'bad',
      },
    ]),
  )
  assert.deepEqual(storage.readIncidentReports(), [])
  cache.set(
    'nova.operations.v2',
    JSON.stringify({
      version: 2,
      alerts: [],
      cases: [{ id: 'bad', timeline: null }],
      audit: [null],
    }),
  )
  persistence.restoreMockOperations()
  assert.ok(!api.cases.some((item) => item.id === 'bad'))
  const seedLength = api.cases.length
  cache.delete('nova.operations.v2')
  persistence.restoreMockOperations()
  assert.equal(api.cases.length, seedLength)
  windowStub.localStorage.getItem = () => { throw new Error('Blocked storage') }
  windowStub.localStorage.setItem = () => { throw new Error('Blocked storage') }
  assert.equal(sessions.readDemoSession(), null)
  assert.equal(theme.getStoredThemeMode(), 'light')
  globalThis.CustomEvent ??= class extends Event { constructor(type, options) { super(type); this.detail = options.detail } }
  assert.doesNotThrow(() => theme.setStoredThemeMode('dark'))
  console.log(
    'Passed: session expiry and shape, safe redirects, 401 handling, readable errors, timeout, encoded IDs, CSRF transport and invalid cache recovery.',
  )
} finally {
  globalThis.window = originalWindow
  globalThis.fetch = originalFetch
  await server.close()
}
