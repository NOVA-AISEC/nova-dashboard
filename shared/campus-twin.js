import { campusPlaces, campusSources } from './campus-reference.js'

export const campusScenarios = [
  {
    id: 'arrival',
    name: 'Morning arrival',
    description: 'Rehearse visitor screening and vehicle queues on a teaching morning.',
    focusPlaceId: 'arrival',
    startsAt: '2026-10-02T04:40:00Z',
  },
  {
    id: 'library',
    name: 'Library item review',
    description: 'Rehearse an unattended-item check while keeping a study entrance clear.',
    focusPlaceId: 'library',
    startsAt: '2026-10-02T07:00:00Z',
  },
  {
    id: 'event',
    name: 'Auditorium ingress',
    description: 'Rehearse admission flow and a second venue during a fictional campus event.',
    focusPlaceId: 'main-auditorium',
    startsAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'service',
    name: 'Service access exception',
    description: 'Rehearse an escort exception and a missing device heartbeat.',
    focusPlaceId: 'service',
    startsAt: '2026-10-02T13:00:00Z',
  },
]

export function validateTwinRequest(payload = {}) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).some((key) => !['scenario', 'minute'].includes(key))
  )
    throw new Error('Invalid campus replay parameters.')
  const scenario = payload.scenario === undefined ? 'arrival' : payload.scenario
  const minute = payload.minute === undefined ? 12 : payload.minute
  if (typeof scenario !== 'string' || !campusScenarios.some((entry) => entry.id === scenario))
    throw new Error('Choose a known campus scenario.')
  if (!Number.isInteger(minute) || minute < 0 || minute > 30)
    throw new Error('Replay minute must be an integer from 0 to 30.')
  return { scenario, minute }
}

export function buildCampusTwin(graph, payload = {}) {
  const { scenario, minute } = validateTwinRequest(payload)
  const exercise = campusScenarios.find((entry) => entry.id === scenario)
  const at = new Date(Date.parse(exercise.startsAt) + minute * 60000).toISOString()
  const visible = new Map(graph.nodes.map((node) => [node.id, node]))
  const mapped = new Map()
  for (const edge of graph.edges) {
    if (edge.relation !== 'anchored-to' || !visible.has(edge.source) || !visible.has(edge.target))
      continue
    const placeId = edge.target.replace(/^campus-place:/, '')
    if (!mapped.has(placeId)) mapped.set(placeId, [])
    mapped.get(placeId).push(edge.source)
  }
  const places = campusPlaces.map((place) => {
    const focused = place.id === exercise.focusPlaceId
    const rising = minute >= 8 && minute < 23
    const overflowVenue =
      scenario === 'event' && place.id === 'microsoft-auditorium' && minute >= 15 && minute < 23
    const occupancy = Math.min(
      98,
      Math.max(
        0,
        place.baseline +
          (overflowVenue ? 28 : 0) +
          (focused
            ? Math.round(Math.sin((minute / 30) * Math.PI) * 47)
            : Math.round(Math.sin((minute + place.baseline) / 9) * 6)),
      ),
    )
    const queue =
      place.id === 'arrival'
        ? Math.max(
            0,
            Math.round((scenario === 'arrival' ? 22 : 5) * Math.sin((minute / 30) * Math.PI)),
          )
        : place.id === 'parking'
          ? Math.round(occupancy / 9)
          : 0
    const deviceStale = scenario === 'service' && place.id === 'service' && minute >= 10
    const readings = [
      {
        id: `sim-occupancy-${place.id}`,
        label: 'Estimated occupancy',
        value: occupancy,
        unit: '%',
        state: occupancy >= 75 ? 'attention' : 'nominal',
        sampledAt: at,
        provenance: 'simulation',
        connector: 'YOLOv8n placeholder · aggregate metadata',
        connected: false,
      },
      {
        id: `sim-access-${place.id}`,
        label: place.kind === 'access-zone' ? 'Access exceptions' : 'Door exceptions',
        value: deviceStale ? null : focused && rising ? 3 : 0,
        unit: 'events',
        state: deviceStale ? 'stale' : focused && rising ? 'attention' : 'nominal',
        sampledAt: deviceStale
          ? new Date(Date.parse(exercise.startsAt) + 9 * 60000).toISOString()
          : at,
        provenance: 'simulation',
        connector: 'Access-control adapter · not connected',
        connected: false,
      },
      {
        id: `sim-heartbeat-${place.id}`,
        label: 'Device heartbeat',
        value: deviceStale ? null : 1,
        unit: deviceStale ? 'stale' : 'sample',
        state: deviceStale ? 'stale' : 'nominal',
        sampledAt: deviceStale
          ? new Date(Date.parse(exercise.startsAt) + 9 * 60000).toISOString()
          : at,
        provenance: 'simulation',
        connector: 'Device-health adapter · not connected',
        connected: false,
      },
    ]
    if (scenario === 'library' && focused)
      readings.push({
        id: `sim-item-${place.id}`,
        label: 'Unattended-item candidates',
        value: rising ? 1 : 0,
        unit: 'review',
        state: rising ? 'attention' : 'nominal',
        sampledAt: at,
        provenance: 'simulation',
        connector: 'YOLOv8n placeholder · metadata candidates require human verification',
        connected: false,
      })
    if (queue || place.id === 'arrival' || place.id === 'parking')
      readings.push({
        id: `sim-queue-${place.id}`,
        label: 'Vehicle queue',
        value: queue,
        unit: 'vehicles',
        state: queue >= 15 ? 'attention' : 'nominal',
        sampledAt: at,
        provenance: 'simulation',
        connector: 'YOLOv8n placeholder · aggregate metadata',
        connected: false,
      })
    const recordIds = [...new Set(mapped.get(place.id) ?? [])]
    const incidents = recordIds
      .map((id) => visible.get(id))
      .filter((node) => node.kind === 'incident')
    const activeIds = incidents
      .filter((node) => !['closed', 'contained'].includes(node.properties.status))
      .map((node) => node.id)
    const status = deviceStale
      ? 'stale'
      : (focused && rising) || overflowVenue || occupancy >= 75 || queue >= 15
        ? 'attention'
        : 'nominal'
    return {
      ...place,
      status,
      readings,
      recordIds,
      activeIncidentIds: activeIds,
      queue,
    }
  })
  const events = [
    { minute: 0, title: 'Exercise starts', detail: exercise.description },
    {
      minute: 8,
      title: scenario === 'library' ? 'Item review requested' : 'Access review requested',
      detail:
        scenario === 'library'
          ? 'A simulated unattended-item candidate needs a desk check. Review the stored library snapshot separately; detection does not establish intent.'
          : 'Simulated flow increases at the selected place. Ask the desk to verify context before considering a response.',
    },
    {
      minute: scenario === 'service' ? 10 : 15,
      title:
        scenario === 'service'
          ? 'Heartbeat unavailable'
          : scenario === 'event'
            ? 'Second venue review checkpoint'
            : 'Desk confirmation checkpoint',
      detail:
        scenario === 'service'
          ? 'The simulated device last reported at minute 9. A missing heartbeat gives no evidence of a secure entrance.'
          : scenario === 'event'
            ? 'Simulated arrival pressure reaches the Microsoft Auditorium. Confirm venue staff and an approved crowd procedure before proposing a diversion.'
            : 'Exercise checkpoint: verify the source snapshot and access context; do not infer identity from a detection.',
    },
    {
      minute: 23,
      title: 'Recovery checkpoint',
      detail:
        'Exercise flow returns toward baseline. Device recovery still needs separate confirmation.',
    },
    {
      minute: 30,
      title: 'Exercise ends',
      detail: 'Record a handover after human review. No real campus action was executed.',
    },
  ]
    .filter((entry) => entry.minute <= minute)
    .map((entry) => ({
      ...entry,
      at: new Date(Date.parse(exercise.startsAt) + entry.minute * 60000).toISOString(),
      placeId: exercise.focusPlaceId,
      provenance: 'simulation',
    }))
  const recommendations = [
    {
      title: 'Verify the place and access context',
      detail:
        'Confirm the exact entrance, zone mapping and approved campus procedure with the responsible desk.',
      basisIds: [`campus-place:${exercise.focusPlaceId}`],
    },
    {
      title:
        scenario === 'service' && minute >= 10
          ? 'Request a human device check'
          : 'Review evidence before escalation',
      detail:
        scenario === 'service' && minute >= 10
          ? 'The exercise heartbeat is stale. Obtain a current observation; a sample reading cannot establish coverage.'
          : 'Review linked incident snapshots and verification gaps in Intelligence. These records retain their original timestamps.',
      basisIds: [
        `campus-place:${exercise.focusPlaceId}`,
        ...places.find((place) => place.id === exercise.focusPlaceId).activeIncidentIds,
      ],
    },
    {
      title: 'Prepare a supervised response',
      detail:
        'Use Command for an existing incident, then submit its mission for supervisor approval. The exercise never creates or dispatches a real incident.',
      basisIds: [`campus-place:${exercise.focusPlaceId}`],
    },
  ]
  const mappedIncidentIds = new Set(
    places.flatMap((place) => place.recordIds.filter((id) => visible.get(id)?.kind === 'incident')),
  )
  const unmapped = graph.nodes
    .filter((node) => node.kind === 'incident' && !mappedIncidentIds.has(node.id))
    .map((node) => ({
      id: node.id,
      title: node.title,
      location: node.properties.location,
    }))
  return {
    version: 1,
    campus: {
      name: 'Strathmore University',
      locality: 'Madaraka · Nairobi, Kenya',
      address: 'Ole Sangale Road',
      timezone: 'Africa/Nairobi',
      geometry: 'conceptual',
      geometryVerified: false,
    },
    generatedAt: graph.generatedAt,
    replay: { scenario, minute, at, exercise },
    scenarios: campusScenarios,
    places,
    sources: campusSources,
    events,
    recommendations,
    unmapped,
    engine: {
      provider: 'local-rules',
      vision: 'YOLOv8n placeholder',
      connected: false,
      mode: 'exercise',
    },
    notice:
      'Public place references + conceptual geometry + simulated telemetry. No live campus connection.',
    limitations: [
      'No surveyed building footprints, gate positions or patrol routes.',
      'No real access policy, capacity, device coverage or campus incident is asserted.',
      'Legacy residence records remain unmapped: Strathmore documents off-campus accommodation.',
    ],
  }
}
