import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import React, { act, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { createServer } from 'vite'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
})
const { window } = dom
const { document } = window
// jsdom lacks SVG layout detection; expose the browser SVG capability used by Leaflet.
window.SVGSVGElement.prototype.createSVGRect = () => ({})
const globals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'Node',
  'NodeFilter',
  'MutationObserver',
  'CustomEvent',
  'Event',
  'StorageEvent',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'IS_REACT_ACT_ENVIRONMENT',
]
const original = new Map(
  globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
)
for (const name of globals)
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value:
      name === 'IS_REACT_ACT_ENVIRONMENT'
        ? true
        : name === 'requestAnimationFrame'
          ? (callback) => setTimeout(callback, 0)
          : name === 'cancelAnimationFrame'
            ? clearTimeout
            : name === 'getComputedStyle'
              ? dom.window.getComputedStyle.bind(dom.window)
              : dom.window[name],
  })
const vite = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  define: { 'import.meta.env.VITE_USE_MOCK': JSON.stringify('true') },
})
const root = createRoot(document.getElementById('root'))
let router
const supervisor = {
  name: 'Supervisor',
  email: 'supervisor@account-test.local',
  role: 'supervisor',
  shift: 'Test',
  expiresAt: Date.now() + 5 * 60_000,
}
const guard = {
  ...supervisor,
  name: 'Guard',
  email: 'guard@account-test.local',
  role: 'guard',
}
const sessionKey = 'nova.session'
function switchSession(session) {
  const oldValue = window.localStorage.getItem(sessionKey)
  const newValue = JSON.stringify(session)
  window.localStorage.setItem(sessionKey, newValue)
  window.dispatchEvent(
    new window.StorageEvent('storage', {
      key: sessionKey,
      oldValue,
      newValue,
      storageArea: window.localStorage,
    }),
  )
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 15))
  })
}
async function waitFor(check, message) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (check()) return
    await settle()
  }
  assert.ok(check(), message)
}
async function click(selector) {
  const element = document.querySelector(selector)
  assert.ok(element, `Missing ${selector}`)
  await act(async () => {
    element.click()
  })
}
try {
  window.localStorage.setItem(sessionKey, JSON.stringify(supervisor))
  const { AuthProvider, RequireAuth, useAuth } = await vite.ssrLoadModule('/src/lib/auth.tsx')
  const { useSecurityOS } = await vite.ssrLoadModule('/src/hooks/use-security-os.ts')
  const { useOperations } = await vite.ssrLoadModule('/src/hooks/use-operations.ts')
  const { CommandPage } = await vite.ssrLoadModule('/src/pages/command-page.tsx')
  const { MissionsPage } = await vite.ssrLoadModule('/src/pages/missions-page.tsx')
  const { IntelligencePage } = await vite.ssrLoadModule('/src/pages/intelligence-page.tsx')
  const { CampusTwinPage } = await vite.ssrLoadModule('/src/pages/campus-twin-page.tsx')
  const api = await vite.ssrLoadModule('/src/api/mock-client.ts')
  const run = await api.runAssessment({
    incidentId: 'alt-705',
    intent: 'assess',
  })
  assert.equal(run.context.caseContextIncluded, true)
  const mission = await api.proposeMission(run.id)
  let mounts = 0
  const observations = []
  function Probe() {
    const { session } = useAuth()
    const security = useSecurityOS()
    const operations = useOperations()
    const [draft, setDraft] = useState('')
    useEffect(() => {
      mounts++
    }, [])
    observations.push({
      role: session.role,
      email: session.email,
      runIds: security.data?.runs.map((item) => item.id) ?? [],
      caseCount: operations.data?.cases.length ?? 0,
      draft,
    })
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'probe-role' }, session.role),
      React.createElement(
        'span',
        { id: 'probe-loaded' },
        !security.isLoading && !operations.isLoading ? 'loaded' : 'loading',
      ),
      React.createElement('span', { id: 'probe-runs' }, security.data?.runs.length ?? 0),
      React.createElement('span', { id: 'probe-draft' }, draft),
      React.createElement(
        'button',
        { id: 'probe-edit', onClick: () => setDraft('Prior operator draft') },
        'Edit',
      ),
    )
  }
  router = createMemoryRouter(
    [
      {
        element: React.createElement(RequireAuth),
        children: [
          { path: '/probe', element: React.createElement(Probe) },
          { path: '/command', element: React.createElement(CommandPage) },
          { path: '/missions', element: React.createElement(MissionsPage) },
          {
            path: '/intelligence',
            element: React.createElement(IntelligencePage),
          },
          { path: '/campus', element: React.createElement(CampusTwinPage) },
        ],
      },
    ],
    { initialEntries: ['/probe'] },
  )
  await act(async () => {
    root.render(
      React.createElement(AuthProvider, null, React.createElement(RouterProvider, { router })),
    )
  })
  await waitFor(
    () => document.querySelector('#probe-loaded')?.textContent === 'loaded',
    'Supervisor records load',
  )
  assert.equal(document.querySelector('#probe-runs').textContent, '1')
  await click('#probe-edit')
  await act(async () => {
    switchSession(guard)
  })
  await waitFor(
    () => document.querySelector('#probe-loaded')?.textContent === 'loaded',
    'Guard records load after switch',
  )
  assert.ok(
    observations
      .filter((item) => item.role === 'guard')
      .every((item) => item.runIds.length === 0 && item.draft === ''),
    'No render under guard retains privileged runs or prior drafts',
  )
  assert.equal(
    observations.find((item) => item.role === 'guard').caseCount,
    0,
    'The first render for the new account also clears the operations cache',
  )
  assert.equal(mounts, 2, 'Cross-tab account switch remounts the authenticated subtree')
  const firstGuardRun = await api.runAssessment({
    incidentId: 'alt-704',
    intent: 'assess',
  })
  await act(async () => {
    window.dispatchEvent(new Event('nova:operations-changed'))
  })
  await waitFor(
    () => document.querySelector('#probe-runs')?.textContent === '1',
    'Guard sees its own run',
  )
  await click('#probe-edit')
  const otherGuard = { ...guard, email: 'other-guard@account-test.local' }
  await act(async () => {
    switchSession(otherGuard)
  })
  await waitFor(
    () => document.querySelector('#probe-loaded')?.textContent === 'loaded',
    'Second guard records load',
  )
  assert.ok(
    observations
      .filter((item) => item.email === otherGuard.email)
      .every((item) => !item.runIds.includes(firstGuardRun.id) && item.draft === ''),
    'Same-role account switch also clears cached runs and drafts',
  )
  await act(async () => {
    switchSession({ ...otherGuard, role: 'supervisor' })
  })
  await waitFor(
    () => document.querySelector('#probe-runs')?.textContent === '2',
    'Same account promotion reloads permitted records',
  )
  await click('#probe-edit')
  await act(async () => {
    switchSession(otherGuard)
  })
  await waitFor(
    () => document.querySelector('#probe-loaded')?.textContent === 'loaded',
    'Same account downgrade completes',
  )
  assert.equal(document.querySelector('#probe-runs').textContent, '0')
  assert.equal(document.querySelector('#probe-draft').textContent, '')
  await click('#probe-edit')
  const mountsBeforeRenewal = mounts
  await act(async () => {
    switchSession({ ...otherGuard, expiresAt: otherGuard.expiresAt + 1000 })
  })
  await waitFor(
    () => document.querySelector('#probe-loaded')?.textContent === 'loaded',
    'New session for the same account reloads',
  )
  assert.equal(mounts, mountsBeforeRenewal + 1)
  assert.equal(document.querySelector('#probe-draft').textContent, '')
  await act(async () => {
    switchSession(supervisor)
    await router.navigate('/command?incident=alt-705')
  })
  await waitFor(
    () => document.querySelector('.os-result-label'),
    'Command loads saved supervisor assessment',
  )
  await click('.os-run-button')
  await waitFor(
    () => JSON.parse(window.localStorage.getItem('nova.security-os.v1')).runs.length === 3,
    'Command saves a local assessment',
  )
  const caseSource = [...document.querySelectorAll('.os-source-list button')].find((button) =>
    button.textContent.includes('case-residence-access'),
  )
  assert.ok(caseSource)
  await act(async () => {
    caseSource.click()
  })
  await waitFor(() => document.querySelector('[role="dialog"]'), 'Source dialog opens')
  await act(async () => {
    switchSession(guard)
  })
  await waitFor(
    () => document.querySelector('.os-assessment-empty'),
    'Guard Command clears local assessment',
  )
  assert.equal(document.querySelector('[role="dialog"]'), null, 'Prior source dialog is removed')
  assert.ok(
    !document.body.textContent.includes('case-residence-access'),
    'No privileged case source survives in Command',
  )
  await act(async () => {
    switchSession(supervisor)
    await router.navigate(`/missions?mission=${mission.id}`)
  })
  await waitFor(() => document.querySelector('#mission-note'), 'Supervisor mission form loads')
  const note = document.querySelector('#mission-note')
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(
      note,
      'Prior supervisor decision',
    )
    note.dispatchEvent(new Event('input', { bubbles: true }))
  })
  assert.equal(note.value, 'Prior supervisor decision')
  await act(async () => {
    switchSession(guard)
  })
  await waitFor(
    () => document.querySelector('.os-missions-empty'),
    'Guard mission view reloads permissions',
  )
  assert.equal(
    document.querySelector('#mission-note'),
    null,
    'Prior mission action draft is removed',
  )
  await act(async () => {
    switchSession(supervisor)
    await router.navigate('/intelligence?entity=incident%3Aalt-705')
  })
  await waitFor(() => document.querySelector('.intel-query-panel'), 'Intelligence loads')
  assert.ok(document.body.textContent.includes('Cases · 5'))
  const gapQuery = [...document.querySelectorAll('.intel-query-suggestions button')].find(
    (button) => button.textContent.includes('Find verification gaps'),
  )
  await act(async () => {
    gapQuery.click()
  })
  await waitFor(() => document.querySelector('.intel-answer'), 'Source-cited query completes')
  assert.ok(document.querySelector('.intel-answer').textContent.includes('Camera mismatch'))
  let exportedBlob, exportedFilename
  const originalCreate = URL.createObjectURL,
    originalRevoke = URL.revokeObjectURL
  const originalAnchorClick = window.HTMLAnchorElement.prototype.click
  URL.createObjectURL = (blob) => {
    exportedBlob = blob
    return 'blob:fixture-intelligence'
  }
  URL.revokeObjectURL = () => {}
  window.HTMLAnchorElement.prototype.click = function () {
    exportedFilename = this.download
  }
  try {
    const exportButton = [...document.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Export brief'),
    )
    await act(async () => {
      exportButton.click()
    })
    const briefing = JSON.parse(await exportedBlob.text())
    assert.equal(exportedFilename, 'nova-intelligence-brief.json')
    assert.equal(briefing.selected, 'incident:alt-705')
    assert.ok(briefing.answer.claims.some((claim) => claim.text.includes('Camera mismatch')))
    assert.ok(briefing.context.nodes.some((node) => node.id === 'evidence:ev-703'))
    assert.ok(
      briefing.answer.sourceIds.every((id) =>
        briefing.citedSources.some((source) => source.id === id),
      ),
    )
    assert.equal(briefing.sampleData, true)
  } finally {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    window.HTMLAnchorElement.prototype.click = originalAnchorClick
  }
  const sourceCitation = [...document.querySelectorAll('.intel-answer button')].find(
    (button) => button.getAttribute('aria-label') === 'Inspect source ev-703',
  )
  await act(async () => {
    sourceCitation.click()
  })
  assert.ok(document.querySelector('.intel-focus').textContent.includes('ev-703'))
  assert.equal(
    document.querySelector('.intel-answer'),
    null,
    'Entity switching clears the old answer',
  )
  await act(async () => {
    switchSession(guard)
  })
  await waitFor(() => document.querySelector('.intel-query-panel'), 'Guard intelligence loads')
  const caseType = [...document.querySelectorAll('option')].find(
    (option) => option.value === 'case',
  )
  assert.equal(caseType.textContent, 'Cases · 0')
  assert.ok(!document.body.textContent.includes('case-residence-access'))
  assert.ok(!document.querySelector('.intel-answer'))
  await act(async () => {
    await router.navigate('/campus?place=library&scenario=library')
  })
  await waitFor(() => document.querySelector('.twin-page'), 'Campus twin loads for guard')
  assert.ok(
    document.querySelector('.twin-inspector-heading').textContent.includes('University Library'),
  )
  assert.ok(document.querySelector('.twin-records a[href="/command?incident=alt-702"]'))
  assert.ok(
    document
      .querySelector('.twin-place-sources a')
      .href.startsWith('https://library.strathmore.edu'),
  )
  assert.equal(document.querySelector('.twin-replay-slider b').textContent, 'Minute 12 / 30')
  await waitFor(
    () => document.querySelector('[aria-label="Select University Auditorium"]'),
    'Sourced map markers load',
  )
  for (const basemap of ['streets', 'footprints', 'satellite', 'footprints']) {
    await act(async () => {
      const select = document.querySelector('[aria-label="Campus basemap"]')
      select.value = basemap
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      document.querySelector('[aria-label="Zoom campus in"]').click()
      document.querySelector('[aria-label="Reset campus view"]').click()
    })
    assert.ok(document.querySelectorAll('.leaflet-overlay-pane path').length > 0)
  }
  assert.equal(document.querySelectorAll('.leaflet-tile').length, 0)
  await act(async () => {
    const scene = document.querySelector('[aria-label="Select University Auditorium"]')
    scene.click()
  })
  assert.ok(router.state.location.search.includes('place=main-auditorium'))
  assert.ok(
    document.querySelector('.twin-inspector-heading').textContent.includes('University Auditorium'),
  )
  await act(async () => {
    const exercise = document.querySelector('[aria-label="Campus exercise"]')
    exercise.value = 'service'
    exercise.dispatchEvent(new Event('change', { bubbles: true }))
  })
  assert.ok(document.querySelector('.twin-state').textContent.includes('stale'))
  assert.ok(document.querySelector('.twin-reading.stale').textContent.includes('stale'))
  assert.ok(router.state.location.search.includes('scenario=service'))
  URL.createObjectURL = (blob) => {
    exportedBlob = blob
    return 'blob:fixture-campus'
  }
  URL.revokeObjectURL = () => {}
  window.HTMLAnchorElement.prototype.click = function () {
    exportedFilename = this.download
  }
  try {
    await act(async () => {
      ;[...document.querySelectorAll('button')]
        .find((button) => button.textContent.includes('Export exercise'))
        .click()
    })
    const briefing = JSON.parse(await exportedBlob.text())
    assert.equal(exportedFilename, 'nova-strathmore-campus-exercise.json')
    assert.equal(briefing.sampleData, true)
    assert.equal(briefing.twin.geography.metadata.license, 'ODbL 1.0')
    assert.equal(
      briefing.twin.geography.features.filter((feature) => feature.properties.kind === 'building')
        .length,
      11,
    )
    assert.equal(briefing.twin.replay.scenario, 'service')
    assert.equal(briefing.selectedPlace, 'service')
    assert.ok(briefing.citedSources.some((source) => source.id === 'campus-place:service'))
    assert.ok(briefing.citedSources.some((source) => source.id === 'campus-source:su-contact'))
    assert.ok(
      briefing.twin.places.every((place) => !place.recordIds.some((id) => id.startsWith('case:'))),
    )
  } finally {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    window.HTMLAnchorElement.prototype.click = originalAnchorClick
  }
  await act(async () => {
    const slider = document.querySelector('[aria-label="Campus replay minute"]')
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(
      slider,
      '30',
    )
    slider.dispatchEvent(new Event('change', { bubbles: true }))
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  })
  assert.equal(document.querySelector('.twin-replay-slider b').textContent, 'Minute 30 / 30')
  await act(async () => {
    switchSession(supervisor)
  })
  await waitFor(() => document.querySelector('.twin-page'), 'Campus twin remounts for new account')
  assert.equal(document.querySelector('.twin-replay-slider b').textContent, 'Minute 12 / 30')
  console.log(
    'Passed: real React account isolation, source dialogs, mission drafts, Intelligence citations, campus place keyboard navigation, stale replay, export provenance and account remount.',
  )
} finally {
  await act(async () => {
    root.unmount()
  })
  router?.dispose()
  await vite.close()
  dom.window.close()
  for (const [name, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
}
