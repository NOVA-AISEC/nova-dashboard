import assert from 'node:assert/strict'
import { buildIntelligence, queryIntelligence } from '../shared/intelligence-engine.js'
import { buildCampusTwin, campusScenarios, validateTwinRequest } from '../shared/campus-twin.js'
import { campusPlaces, campusSources, resolveCampusPlace } from '../shared/campus-reference.js'

const alert = (id, zone) => ({
  id,
  title: `Test incident ${id}`,
  zone,
  cameraId: 'SIM-CAM',
  severity: 'high',
  status: 'new',
  createdAt: '2026-02-28T06:00:00Z',
  updatedAt: '2026-02-28T06:10:00Z',
  evidenceIds: [],
  summary: 'Stored test record',
  rule: 'Manual review',
  assignee: 'Test desk',
})
const records = {
  alerts: [
    alert('mapped', ' Library   Entrance '),
    alert('residence', 'Residence Block B  Lobby'),
    alert('similar', 'Library Annex'),
    alert('unknown', 'Dock 7'),
  ],
  evidence: [],
  cases: [],
  audit: [],
  cameras: [],
  zones: [],
}
const graph = buildIntelligence(
  records,
  { runs: [], missions: [] },
  { email: 'guard@twin.test', role: 'guard' },
)
const original = JSON.stringify(graph)
const responseGraph = buildIntelligence(
  records,
  {
    runs: [
      {
        id: 'run-twin',
        actor: 'guard@twin.test',
        model: 'placeholder',
        provider: 'local-rules',
        intent: 'assess',
        createdAt: '2026-10-02T10:00:00Z',
        assessment: { summary: 'Saved review' },
        context: { incident: records.alerts[0], sources: [], caseContextIncluded: false },
      },
    ],
    missions: [
      {
        id: 'mission-twin',
        runId: 'run-twin',
        incidentId: 'mapped',
        title: 'Test response',
        summary: 'Human approved review',
        status: 'active',
        assignedTeam: 'Test team',
        revision: 1,
        updatedAt: '2026-10-02T10:00:00Z',
        playbookId: 'test',
        activity: [],
      },
    ],
  },
  { email: 'guard@twin.test', role: 'guard' },
)
const responsePlace = buildCampusTwin(responseGraph).places.find((place) => place.id === 'library')
assert.ok(responsePlace.recordIds.includes('assessment:run-twin'))
assert.ok(responsePlace.recordIds.includes('mission:mission-twin'))
assert.equal(resolveCampusPlace(' Library  Entrance ')?.id, 'library')
assert.equal(resolveCampusPlace('Library Annex'), null)
assert.equal(resolveCampusPlace('Residence Block B  Lobby'), null)
assert.equal(campusPlaces.length, 8)
assert.equal(campusPlaces.filter((place) => place.provenance === 'public-reference').length, 4)
assert.ok(campusSources.every((source) => new URL(source.url).protocol === 'https:'))
assert.ok(campusSources.some((source) => source.fact.includes('does not have accommodation')))
const available = new Set(graph.nodes.map((node) => node.id))
assert.equal(
  graph.nodes.find((node) => node.id === 'campus-place:library').provenance,
  'public-reference',
)
assert.equal(
  graph.nodes.find((node) => node.id === 'campus-place:arrival').provenance,
  'modeled-zone',
)
assert.ok(
  graph.gaps.some(
    (gap) =>
      gap.title === 'Campus location unverified' && gap.sourceIds.includes('incident:residence'),
  ),
)
for (const scenario of campusScenarios) {
  for (const minute of [0, 8, 12, 15, 23, 30]) {
    const twin = buildCampusTwin(graph, { scenario: scenario.id, minute })
    assert.deepEqual(
      twin,
      buildCampusTwin(graph, { scenario: scenario.id, minute }),
      'Replay must be deterministic',
    )
    assert.equal(twin.engine.connected, false)
    assert.equal(twin.campus.geometryVerified, false)
    assert.equal(twin.places.length, 8)
    assert.ok(
      twin.places.every((place) =>
        place.sourceIds.every((id) => campusSources.some((source) => source.id === id)),
      ),
    )
    assert.ok(twin.places.every((place) => place.recordIds.every((id) => available.has(id))))
    assert.ok(
      twin.places.every((place) =>
        place.readings.every(
          (reading) => reading.provenance === 'simulation' && !reading.connected,
        ),
      ),
    )
    assert.ok(
      twin.events.every((event) => event.minute <= minute && event.provenance === 'simulation'),
    )
    assert.ok(
      twin.recommendations.every(
        (item) => item.basisIds.length && item.basisIds.every((id) => available.has(id)),
      ),
    )
    assert.ok(twin.unmapped.some((node) => node.id === 'incident:residence'))
    assert.ok(!twin.places.some((place) => place.recordIds.includes('incident:residence')))
    assert.ok(
      twin.places.find((place) => place.id === 'library').recordIds.includes('incident:mapped'),
    )
    assert.ok(!twin.places.some((place) => place.recordIds.includes('incident:similar')))
  }
}
assert.equal(JSON.stringify(graph), original, 'Replay must not mutate records or source times')
const stale = buildCampusTwin(graph, { scenario: 'service', minute: 30 }).places.find(
  (place) => place.id === 'service',
)
assert.equal(stale.status, 'stale')
assert.equal(stale.readings.find((reading) => reading.label === 'Access exceptions').value, null)
assert.equal(stale.readings.find((reading) => reading.label === 'Device heartbeat').value, null)
assert.equal(
  stale.readings.find((reading) => reading.label === 'Device heartbeat').sampledAt,
  '2026-10-02T13:09:00.000Z',
)
assert.equal(
  buildCampusTwin(graph, { scenario: 'service', minute: 9 }).places.find(
    (place) => place.id === 'service',
  ).status,
  'attention',
)
const overflow = buildCampusTwin(graph, { scenario: 'event', minute: 15 }).places.find(
  (place) => place.id === 'microsoft-auditorium',
)
assert.equal(overflow.status, 'attention')
assert.equal(
  buildCampusTwin(graph, { scenario: 'library', minute: 12 })
    .places.find((place) => place.id === 'library')
    .readings.find((reading) => reading.label === 'Unattended-item candidates').value,
  1,
)
const references = queryIntelligence(graph, {
  question: 'Trace campus connections',
  nodeId: 'campus-place:library',
})
assert.ok(references.claims.some((claim) => claim.sourceIds.includes('campus-source:su-library')))
assert.ok(references.sourceIds.every((id) => available.has(id)))
assert.ok(
  !queryIntelligence(graph, {
    question: 'Show evidence',
    nodeId: 'incident:mapped',
  }).sourceIds.includes('incident:residence'),
)
for (const bad of [
  { scenario: 'real-time' },
  { minute: -1 },
  { minute: 31 },
  { minute: 1.5 },
  { minute: '12' },
  { scenario: ['arrival'] },
  { minute: null },
  { role: 'admin' },
  { dispatch: true },
  null,
  [],
])
  assert.throws(() => validateTwinRequest(bad))
console.log(
  'Passed: sourced campus catalog, exact alias mapping, excluded residence/unknown locations, deterministic replay, immutable records, stale telemetry, cited context and strict replay validation.',
)
