import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Exercise the real mock API in an isolated browser-storage stub.
const cache = new Map()
let storageFails = false
const windowStub = new EventTarget()
windowStub.localStorage = {
  getItem: (key) => cache.get(key) ?? null,
  setItem: (key, value) => {
    if (storageFails) throw new Error('quota')
    cache.set(key, value)
  },
  removeItem: (key) => cache.delete(key),
}
windowStub.setTimeout = () => 0
const originalWindow = globalThis.window
const originalDocument = globalThis.document
const originalCreateUrl = URL.createObjectURL
const originalRevokeUrl = URL.revokeObjectURL
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
globalThis.window = windowStub
try {
  const api = await server.ssrLoadModule('/src/api/mock-client.ts')
  const persistence = await server.ssrLoadModule('/src/lib/mock-persistence.ts')
  const operations = await server.ssrLoadModule('/src/lib/operations.ts')
  const storage = await server.ssrLoadModule('/src/lib/operator-storage.ts')
  const brief = await server.ssrLoadModule('/src/lib/shift-brief.ts')
  const newAlert = api.alerts.find((item) => item.status === 'new')
  const previous = { ...newAlert }
  const auditCount = api.auditEvents.length
  await api.ackAlert(newAlert.id)
  assert.equal(newAlert.status, 'acknowledged')
  assert.equal(api.auditEvents.length, auditCount + 1)
  await api.ackAlert(newAlert.id)
  assert.equal(api.auditEvents.length, auditCount + 1, 'acknowledgement is idempotent')
  Object.assign(newAlert, previous)
  persistence.restoreMockOperations()
  assert.equal(newAlert.status, 'acknowledged', 'acknowledgement survives restoration')
  const contained = api.alerts.find((item) => item.status === 'contained' || item.status === 'closed')
  await assert.rejects(api.ackAlert(contained.id), /Only a new incident/)
  assert.equal(operations.isActiveAlert(contained), false)
  const sorted = operations.sortAlerts(api.alerts)
  assert.equal(sorted[0].severity, 'critical')
  assert.ok(new Date(sorted[0].createdAt) >= new Date(sorted[1].createdAt))
  const payload = {
    title: 'Persistence test',
    summary: 'Test only',
    location: 'Library Entrance',
    priority: 'priority-2',
    status: 'active',
    leadAnalyst: 'QA',
    protocol: 'Review',
  }
  const created = await api.createCase(payload)
  api.cases.splice(
    api.cases.findIndex((item) => item.id === created.id),
    1,
  )
  persistence.restoreMockOperations()
  assert.equal((await api.getCase(created.id)).title, payload.title)
  storageFails = true
  const nextAlert = api.alerts.find((item) => item.status === 'new')
  const nextBefore = { ...nextAlert }
  const beforeFailedAck = api.auditEvents.length
  await assert.rejects(api.ackAlert(nextAlert.id), /could not be saved/)
  assert.equal(nextAlert.status, nextBefore.status)
  assert.equal(api.auditEvents.length, beforeFailedAck)
  const casesBefore = api.cases.length
  await assert.rejects(api.createCase(payload), /could not be saved/)
  assert.equal(api.cases.length, casesBefore, 'failed save rolls back case creation')
  storageFails = false
  cache.set('dama-sentinel.incident-reports', '{"bad":true}')
  assert.deepEqual(storage.readIncidentReports(), [])
  cache.set('dama-sentinel.shift-notes', '[1]')
  assert.equal(storage.readShiftNotes(), '')
  cache.set('dama-sentinel.preferences', 'null')
  assert.equal(storage.readOperatorPreferences().compactTables, true)
  let capturedBlob,
    downloadedName,
    clicked = false,
    appended = false,
    removed = false
  URL.createObjectURL = (blob) => {
    capturedBlob = blob
    return 'blob:test'
  }
  URL.revokeObjectURL = () => {}
  const anchor = {
    click() {
      clicked = true
    },
    remove() {
      removed = true
    },
    set download(value) {
      downloadedName = value
    },
  }
  globalThis.document = {
    createElement: () => anchor,
    body: {
      append() {
        appended = true
      },
    },
  }
  brief.exportShiftBrief({
    generatedBy: 'QA',
    notes: '<script>alert("x")</script>\nFollow up',
    alerts: [newAlert],
    cases: [created],
  })
  const html = await capturedBlob.text()
  assert.ok(clicked && appended && removed)
  assert.match(downloadedName, /^nova-shift-brief-.*\.html$/)
  assert.match(html, /&lt;script&gt;/)
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes(newAlert.title) && html.includes(payload.title))
  assert.match(html, /SAMPLE WORKSPACE/)
  console.log(
    'Passed: incident transitions, priority order, persistence, rollback, cache recovery, and safe handover download.',
  )
} finally {
  globalThis.window = originalWindow
  globalThis.document = originalDocument
  URL.createObjectURL = originalCreateUrl
  URL.revokeObjectURL = originalRevokeUrl
  await server.close()
}
