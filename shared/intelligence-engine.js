import { campusPlaces, campusSources, resolveCampusPlace } from './campus-reference.js'
// A shared, source-backed ontology. Relationships describe stored records, not inferred identity.
export const entityKinds = [
  'incident',
  'evidence',
  'case',
  'camera',
  'location',
  'team',
  'assessment',
  'mission',
  'campus-place',
  'campus-source',
]
export const intelligenceModes = ['connections', 'evidence', 'gaps', 'timeline', 'response']
const open = (status) =>
  !['closed', 'contained', 'completed', 'rejected', 'cancelled'].includes(status)
const key = (kind, id) => `${kind}:${id}`

export function buildIntelligence(records, security, user) {
  if (!user || !['guard', 'analyst', 'supervisor', 'admin'].includes(user.role))
    throw new Error('An authenticated operator is required.')
  const nodes = new Map(),
    edges = new Map(),
    gaps = [],
    timeline = []
  let omitted = 0
  const add = (kind, id, title, detail, properties = {}, recordedAt = '') => {
    const nodeId = key(kind, id)
    if (nodes.has(nodeId)) return nodeId
    if (nodes.size >= 2000) {
      omitted++
      return null
    }
    nodes.set(nodeId, {
      id: nodeId,
      kind,
      recordId: id,
      title,
      detail,
      properties,
      recordedAt,
      provenance: 'stored-record',
    })
    return nodeId
  }
  const link = (source, target, relation, basis, sourceIds) => {
    if (!nodes.has(source) || !nodes.has(target)) return
    const id = JSON.stringify([source, target, relation])
    if (edges.has(id)) return
    if (edges.size >= 6000) {
      omitted++
      return
    }
    edges.set(id, {
      id,
      source,
      target,
      relation,
      basis,
      sourceIds: sourceIds.filter((id) => nodes.has(id)),
    })
  }
  const issue = (id, title, detail, sourceIds) => {
    const visibleSources = sourceIds.filter((id) => nodes.has(id))
    if (!visibleSources.length) {
      omitted++
      return
    }
    if (gaps.length < 2000) gaps.push({ id, title, detail, sourceIds: visibleSources })
  }
  const event = (id, title, detail, at, sourceIds) => {
    const visibleSources = sourceIds.filter((id) => nodes.has(id))
    if (!visibleSources.length) {
      omitted++
      return
    }
    if (timeline.length < 6000 && Number.isFinite(Date.parse(at)))
      timeline.push({ id, title, detail, at, sourceIds: visibleSources })
  }
  const alerts = records.alerts.slice(0, 600),
    evidence = records.evidence.slice(0, 600)
  const cases = user.role === 'guard' ? [] : records.cases.slice(0, 300)
  const runs = security.runs
    .filter(
      (run) =>
        user.role !== 'guard' || (run.actor === user.email && !run.context.caseContextIncluded),
    )
    .slice(0, 200)
  const runIds = new Set(runs.map((run) => run.id))
  const missions = security.missions.filter((mission) => runIds.has(mission.runId)).slice(0, 200)
  omitted +=
    Math.max(0, records.alerts.length - alerts.length) +
    Math.max(0, records.evidence.length - evidence.length)
  if (user.role !== 'guard') omitted += Math.max(0, records.cases.length - cases.length)
  omitted += Math.max(
    0,
    security.runs.filter(
      (run) =>
        user.role !== 'guard' || (run.actor === user.email && !run.context.caseContextIncluded),
    ).length - runs.length,
  )
  omitted += Math.max(
    0,
    security.missions.filter((mission) => runIds.has(mission.runId)).length - missions.length,
  )
  for (const source of campusSources) {
    const id = add('campus-source', source.id, source.title, source.fact, {
      sourceUrl: source.url,
      checkedAt: source.checkedAt,
    })
    nodes.get(id).provenance = 'public-reference'
  }
  for (const place of campusPlaces) {
    const id = add('campus-place', place.id, place.name, place.description, {
      registration:
        place.provenance === 'public-reference'
          ? 'Publicly documented place'
          : 'Proposed operational zone',
      geometry: place.geometryNote,
      geometryStatus: place.geometryStatus,
      geographicFeatures: place.geometryFeatureIds.join(', ') || 'Unlocated',
      responsibility: `${place.responsibility} (proposed)`,
    })
    nodes.get(id).provenance = place.provenance
    for (const source of place.sourceIds)
      link(
        id,
        key('campus-source', source),
        'references',
        source.startsWith('osm-')
          ? 'OpenStreetMap source supplies geographic geometry; operational assignments and indoor locations remain unverified'
          : place.provenance === 'public-reference'
            ? 'Public reference supports place identity; operational assignments remain assumptions'
            : 'Public reference supports campus context only; this operational zone is proposed',
        [id, key('campus-source', source)],
      )
  }
  for (const alert of alerts) {
    const id = add(
      'incident',
      alert.id,
      alert.title,
      alert.summary,
      {
        severity: alert.severity,
        status: alert.status,
        location: alert.zone,
        camera: alert.cameraId,
        team: alert.assignee,
        rule: alert.rule,
      },
      alert.updatedAt,
    )
    if (!id) continue
    event(`created:${alert.id}`, 'Incident recorded', alert.title, alert.createdAt, [id])
  }
  for (const item of evidence) {
    const id = add(
      'evidence',
      item.id,
      item.title,
      item.summary,
      {
        location: item.metadata.zone,
        camera: item.metadata.cameraId,
        snapshot: item.snapshotUrl,
        labels: item.metadata.classes.join(', '),
        source: 'Sample snapshot metadata',
        custody: item.chainOfCustody,
      },
      item.metadata.ts,
    )
    event(`captured:${item.id}`, 'Snapshot recorded', item.title, item.metadata.ts, [id])
  }
  for (const item of cases) {
    const id = add(
      'case',
      item.id,
      item.title,
      item.summary,
      { status: item.status, location: item.location, owner: item.leadAnalyst },
      item.updatedAt,
    )
    for (const entry of item.timeline.slice(0, 100))
      event(`case:${item.id}:${entry.id}`, entry.title, entry.detail, entry.timestamp, [id])
  }
  for (const run of runs) {
    const id = add(
      'assessment',
      run.id,
      `${run.context.incident.title} · assessment`,
      run.assessment.summary,
      {
        model: run.model,
        provider: run.provider,
        actor: run.actor,
        intent: run.intent,
        incident: run.context.incident.id,
      },
      run.createdAt,
    )
    link(
      id,
      key('incident', run.context.incident.id),
      'assesses',
      'Assessment incident reference',
      [id],
    )
    for (const source of run.context.sources)
      link(
        id,
        key(source.kind === 'alert' ? 'incident' : source.kind, source.id),
        'cites',
        'Assessment source reference',
        [id],
      )
    event(`assessed:${run.id}`, 'Assessment saved', run.assessment.summary, run.createdAt, [id])
  }
  for (const mission of missions) {
    const id = add(
      'mission',
      mission.id,
      mission.title,
      mission.summary,
      {
        status: mission.status,
        team: mission.assignedTeam,
        revision: String(mission.revision),
        incident: mission.incidentId,
        playbook: mission.playbookId,
      },
      mission.updatedAt,
    )
    link(id, key('assessment', mission.runId), 'prepared from', 'Mission assessment reference', [
      id,
    ])
    link(id, key('incident', mission.incidentId), 'responds to', 'Mission incident reference', [id])
    for (const entry of mission.activity)
      event(
        `mission:${mission.id}:${entry.revision}`,
        entry.action.replaceAll('-', ' '),
        entry.note || mission.title,
        entry.at,
        [id],
      )
  }
  // Camera/location/team nodes are the values in records; co-location is not causation.
  for (const node of [...nodes.values()]) {
    for (const [property, kind, relation] of [
      ['camera', 'camera', 'recorded by'],
      ['location', 'location', 'located at'],
      ['team', 'team', 'assigned to'],
    ]) {
      const value = node.properties[property]
      if (!value) continue
      const target = add(
        kind,
        value,
        value,
        `${kind === 'camera' ? 'Camera identifier' : kind === 'team' ? 'Responsible team label' : 'Location label'} appearing in stored records.`,
        {},
        '',
      )
      link(node.id, target, relation, `Exact ${property} value on the source record`, [node.id])
    }
  }
  for (const alert of alerts) {
    const id = key('incident', alert.id)
    for (const evidenceId of alert.evidenceIds) {
      const target = key('evidence', evidenceId)
      link(id, target, 'has evidence', 'Incident evidence ID reference', [id, target])
      const snapshot = nodes.get(target)
      if (!snapshot)
        issue(
          `missing:${alert.id}:${evidenceId}`,
          'Linked evidence unavailable',
          `${evidenceId} is referenced by this incident but is unavailable in this graph.`,
          [id],
        )
      else if (snapshot.properties.camera !== alert.cameraId)
        issue(
          `camera:${alert.id}:${evidenceId}`,
          'Camera mismatch',
          `Incident ${alert.id} records ${alert.cameraId}; snapshot ${evidenceId} records ${snapshot.properties.camera}. Verify why these records are linked.`,
          [id, target],
        )
    }
    if (!alert.evidenceIds.length)
      issue(
        `snapshot:${alert.id}`,
        'No linked snapshot',
        'This incident has no linked snapshot to inspect.',
        [id],
      )
    if (open(alert.status))
      issue(
        `current:${alert.id}`,
        'Current conditions unverified',
        'Stored records do not confirm current conditions or intent. Request a human ground check before acting.',
        [id],
      )
  }
  for (const item of cases) {
    const id = key('case', item.id)
    for (const alertId of new Set([
      ...item.alertIds,
      ...alerts.filter((alert) => alert.caseId === item.id).map((alert) => alert.id),
    ]))
      link(id, key('incident', alertId), 'investigates', 'Recorded case/incident ID reference', [
        id,
        key('incident', alertId),
      ])
    for (const evidenceId of item.evidenceIds)
      link(id, key('evidence', evidenceId), 'includes', 'Case evidence ID reference', [
        id,
        key('evidence', evidenceId),
      ])
  }
  for (const node of [...nodes.values()]) {
    const location = node.kind === 'location' ? node.recordId : node.properties.location
    if (!location) continue
    const place = resolveCampusPlace(location)
    if (place) {
      link(
        node.id,
        key('campus-place', place.id),
        'anchored-to',
        `Configured exact location alias: ${location}. Mapping is a design assumption, not a verified campus observation.`,
        [node.id, key('campus-place', place.id)],
      )
    } else if (node.kind === 'incident') {
      issue(
        `unmapped:${node.recordId}`,
        'Campus location unverified',
        `“${location}” has no approved place mapping. Off-campus residence and generic legacy locations are excluded from the campus twin.`,
        [node.id],
      )
    }
  }
  for (const node of nodes.values()) {
    if (!['assessment', 'mission'].includes(node.kind)) continue
    const incident = nodes.get(key('incident', node.properties.incident))
    const place = incident ? resolveCampusPlace(incident.properties.location) : null
    if (place)
      link(
        node.id,
        key('campus-place', place.id),
        'anchored-to',
        'Explicit incident reference followed by its configured campus alias; location still needs campus validation.',
        [node.id, incident.id, key('campus-place', place.id)],
      )
  }
  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    gaps,
    timeline: timeline.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    omitted,
    generatedAt: new Date().toISOString(),
    engine: {
      provider: 'local-rules',
      model: 'YOLOv8n placeholder',
      inferenceConnected: false,
      label: 'Source-backed query engine',
      detail:
        'Deterministic retrieval over recorded relationships. No generative model or live vision inference is connected.',
    },
  }
}

export function neighborhood(graph, nodeId, depth = 1) {
  if (!graph.nodes.some((node) => node.id === nodeId))
    throw new Error('Entity not found in your visible workspace.')
  if (![1, 2].includes(depth)) throw new Error('Connection depth must be 1 or 2.')
  const ids = new Set([nodeId])
  for (let hop = 0; hop < depth; hop++) {
    const frontier = new Set(ids)
    for (const edge of graph.edges) {
      if (frontier.has(edge.source)) ids.add(edge.target)
      if (frontier.has(edge.target)) ids.add(edge.source)
    }
  }
  return {
    nodes: graph.nodes.filter((node) => ids.has(node.id)),
    edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
  }
}

const stopwords = new Set(
  'what which where when why how show find the a an is are was were of for to in on and with about me connected connections evidence snapshot snapshots gaps missing timeline response plan records incident incidents'.split(
    ' ',
  ),
)
export function queryIntelligence(graph, payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).some((field) => !['question', 'nodeId', 'mode'].includes(field))
  )
    throw new Error('Invalid intelligence query.')
  const question = payload.question
  if (
    typeof question !== 'string' ||
    !question.trim() ||
    question.length > 600 ||
    [...question].some(
      (character) => character.charCodeAt(0) < 32 && ![9, 10, 13].includes(character.charCodeAt(0)),
    )
  )
    throw new Error('Enter a question between 1 and 600 characters.')
  if (
    payload.nodeId !== undefined &&
    (typeof payload.nodeId !== 'string' || payload.nodeId.length > 500)
  )
    throw new Error('Invalid entity reference.')
  if (payload.mode !== undefined && !intelligenceModes.includes(payload.mode))
    throw new Error('Unknown query mode.')
  const normalized = question.toLowerCase()
  const mode =
    payload.mode ??
    (/gap|missing|mismatch|uncertain|verify/.test(normalized)
      ? 'gaps'
      : /timeline|when|sequence|chronolog/.test(normalized)
        ? 'timeline'
        : /response|next|procedure|mission/.test(normalized)
          ? 'response'
          : /evidence|snapshot|source|camera/.test(normalized)
            ? 'evidence'
            : /connect|relat|link|where/.test(normalized)
              ? 'connections'
              : null)
  const terms = normalized.match(/[a-z0-9_-]+/g)?.filter((term) => !stopwords.has(term)) ?? []
  const ranked = graph.nodes
    .map((node) => ({
      node,
      score: terms.reduce(
        (score, term) =>
          score +
          (`${node.recordId} ${node.title}`.toLowerCase().includes(term)
            ? 3
            : node.detail.toLowerCase().includes(term)
              ? 1
              : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))
  const anchor = payload.nodeId
    ? graph.nodes.find((node) => node.id === payload.nodeId)
    : ranked[0]?.node
  if (payload.nodeId && !anchor) throw new Error('Entity not found in your visible workspace.')
  const empty = {
    question: question.trim(),
    mode: mode ?? 'connections',
    anchorId: anchor?.id ?? '',
    provider: 'local-rules',
    generatedAt: new Date().toISOString(),
    claims: [],
    sourceIds: [],
  }
  if (!mode)
    return {
      ...empty,
      status: 'unsupported',
      summary:
        'This engine supports evidence, connections, verification gaps, timelines, and response records. Choose one of these questions to get a source-backed answer.',
    }
  if (!anchor)
    return {
      ...empty,
      status: 'no-match',
      summary:
        'No visible entity matches this question. Select an entity or include its record ID or title.',
    }
  const direct = neighborhood(graph, anchor.id, 1)
  const ids = new Set(direct.nodes.map((node) => node.id))
  // A second hop via a recorded case/incident adds evidence context. Shared teams/locations alone do not expand query scope.
  for (const node of direct.nodes.filter((node) =>
    ['incident', 'case', 'assessment', 'mission'].includes(node.kind),
  ))
    for (const edge of graph.edges) {
      if (edge.source === node.id) ids.add(edge.target)
      if (edge.target === node.id) ids.add(edge.source)
    }
  const scope = graph.nodes.filter((node) => ids.has(node.id))
  let claims
  if (mode === 'gaps')
    claims = graph.gaps
      .filter((gap) => gap.sourceIds.every((id) => ids.has(id)))
      .map((gap) => ({
        text: `${gap.title}: ${gap.detail}`,
        sourceIds: gap.sourceIds,
      }))
  else if (mode === 'timeline')
    claims = graph.timeline
      .filter((entry) => entry.sourceIds.some((id) => ids.has(id)))
      .slice(0, 30)
      .map((entry) => ({
        text: `${entry.at} · ${entry.title}: ${entry.detail}`,
        sourceIds: entry.sourceIds,
      }))
  else if (mode === 'evidence')
    claims = scope
      .filter((node) => node.kind === 'evidence')
      .map((node) => ({
        text: `${node.title}. ${node.detail} Recorded by ${node.properties.camera} at ${node.recordedAt}.`,
        sourceIds: [node.id],
      }))
  else if (mode === 'response')
    claims = scope
      .filter((node) => ['mission', 'assessment'].includes(node.kind))
      .map((node) => ({
        text: `${node.title}: ${node.detail}${node.properties.status ? ` Status: ${node.properties.status}; team: ${node.properties.team}.` : ''}`,
        sourceIds: [node.id],
      }))
  else
    claims = graph.edges
      .filter(
        (edge) =>
          ids.has(edge.source) &&
          ids.has(edge.target) &&
          (edge.source === anchor.id || edge.target === anchor.id),
      )
      .map((edge) => ({
        text: `${graph.nodes.find((node) => node.id === edge.source).title} → ${edge.relation} → ${graph.nodes.find((node) => node.id === edge.target).title}. Basis: ${edge.basis}.`,
        sourceIds: edge.sourceIds,
      }))
  claims = claims.slice(0, 30)
  const sourceIds = [...new Set(claims.flatMap((claim) => claim.sourceIds))]
  if (claims.some((claim) => !claim.sourceIds.length || claim.sourceIds.some((id) => !ids.has(id))))
    throw new Error('Ungrounded query result.')
  return {
    ...empty,
    status: claims.length ? 'answered' : 'no-match',
    claims,
    sourceIds,
    summary: claims.length
      ? `${claims.length} source-backed ${mode === 'gaps' ? 'verification gaps' : mode === 'timeline' ? 'recorded events' : mode === 'connections' ? 'connections' : `${mode} records`} for ${anchor.title}.`
      : `No ${mode} records are available in the connected context for ${anchor.title}.`,
  }
}
