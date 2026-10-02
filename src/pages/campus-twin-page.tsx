import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  DoorOpen,
  Layers3,
  MapPin,
  Network,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { CampusScene, type CampusLayer } from '@/components/campus/campus-scene'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { useCampusTwin } from '@/hooks/use-campus-twin'
import { formatTime, formatShiftDate } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'
import { campusPlaces } from '../../shared/campus-reference'
import { campusScenarios } from '../../shared/campus-twin'

export function CampusTwinPage() {
  const [params, setParams] = useSearchParams()
  const scenario = campusScenarios.some((item) => item.id === params.get('scenario'))
    ? params.get('scenario')!
    : (campusScenarios.find((item) => item.focusPlaceId === params.get('place'))?.id ?? 'arrival')
  const [minute, setMinute] = useState(12)
  const [layer, setLayer] = useState<CampusLayer>('security')
  const [flat, setFlat] = useState(false)
  const [showUnmapped, setShowUnmapped] = useState(false)
  const { twin, data: graph, error, isLoading, refresh } = useCampusTwin(scenario, minute)
  if (isLoading && !twin) return <LoadingPanel lines={12} />
  if (error || !twin || !graph) return <ErrorPanel message={error ?? 'Campus twin unavailable.'} />
  const selected =
    twin.places.find((place) => place.id === params.get('place')) ??
    twin.places.find((place) => place.id === twin.replay.exercise.focusPlaceId)!
  const incidentNodes = graph.nodes.filter(
    (node) => selected.recordIds.includes(node.id) && node.kind === 'incident',
  )
  const evidenceNodes = graph.nodes.filter(
    (node) => selected.recordIds.includes(node.id) && node.kind === 'evidence',
  )
  const missions = graph.nodes.filter(
    (node) => selected.recordIds.includes(node.id) && node.kind === 'mission',
  )
  const linkedGaps = graph.gaps.filter((gap) =>
    gap.sourceIds.some((id) => selected.recordIds.includes(id)),
  )
  const attention = twin.places.filter((place) => place.status === 'attention').length
  const stale = twin.places.filter((place) => place.status === 'stale').length
  const active = new Set(twin.places.flatMap((place) => place.activeIncidentIds)).size
  const placeHref = `/intelligence?entity=${encodeURIComponent(`campus-place:${selected.id}`)}`
  const scenes = twin.places.map((place) => ({
    ...place,
    occupancy: place.readings[0].value ?? 0,
    incidentCount: place.activeIncidentIds.length,
  }))
  function select(id: string) {
    setParams({ place: id, scenario })
  }
  function changeScenario(id: string) {
    setMinute(12)
    setParams({
      scenario: id,
      place: campusScenarios.find((item) => item.id === id)!.focusPlaceId,
    })
  }
  function exportBrief() {
    const citedIds = new Set([
      `campus-place:${selected.id}`,
      ...selected.sourceIds.map((id) => `campus-source:${id}`),
      ...twin!.recommendations.flatMap((item) => item.basisIds),
      ...linkedGaps.flatMap((gap) => gap.sourceIds),
    ])
    downloadFile(
      'nova-strathmore-campus-exercise.json',
      JSON.stringify(
        {
          title: 'Strathmore campus security exercise',
          sampleData: true,
          twin,
          selectedPlace: selected.id,
          linkedRecords: graph!.nodes.filter((node) => selected.recordIds.includes(node.id)),
          verificationGaps: linkedGaps,
          citedSources: graph!.nodes.filter((node) => citedIds.has(node.id)),
        },
        null,
        2,
      ),
      'application/json',
    )
  }
  return (
    <div className="twin-page">
      <header className="twin-heading">
        <div>
          <span className="twin-eyebrow">
            <Building2 size={13} /> NOVA / SMART CAMPUS
          </span>
          <h1>Strathmore campus twin.</h1>
          <p>
            Strathmore University <span> / </span> Madaraka, Nairobi <span> / </span> Security &
            access
          </p>
        </div>
        <div className="twin-heading-actions">
          <button onClick={refresh} aria-label="Refresh campus records">
            <RotateCcw size={15} />
          </button>
          <button onClick={exportBrief}>
            <ArrowDownToLine size={14} />
            Export exercise
          </button>
          <Link to="/intelligence">
            <Network size={14} />
            Intelligence
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>
      <div className="twin-trust">
        <span>
          <i />
          CAMPUS TWIN · EXERCISE MODE
        </span>
        <p>Referenced places. Conceptual layout. Simulated readings.</p>
        <span>
          <Radio size={13} />
          Live connections: 0
        </span>
      </div>
      <section className="twin-metrics" aria-label="Campus security overview">
        <div>
          <span>Campus registry</span>
          <strong>
            {twin.places.length}
            <small>places & proposed zones</small>
          </strong>
          <p>
            {campusPlaces.filter((place) => place.provenance === 'public-reference').length}{' '}
            publicly documented places
          </p>
        </div>
        <div>
          <span>Linked open incidents</span>
          <strong>
            {active}
            <small>stored sample records</small>
          </strong>
          <p>Original record times retained</p>
        </div>
        <div>
          <span>Exercise attention</span>
          <strong>
            {attention}
            <small>zones to review</small>
          </strong>
          <p>Derived from simulated readings</p>
        </div>
        <div>
          <span>Device visibility</span>
          <strong>
            {stale ? (
              <>
                {stale}
                <small>stale exercise feed</small>
              </>
            ) : (
              <>
                0<small>live devices connected</small>
              </>
            )}
          </strong>
          <p>
            {stale
              ? 'Unknown condition needs a human check'
              : 'YOLOv8n and access adapters pending'}
          </p>
        </div>
      </section>
      {!!graph.omitted && (
        <p className="twin-partial" role="status">
          Partial record view: {graph.omitted} items exceeded the Intelligence projection limits.
          Campus counts cover visible records only.
        </p>
      )}
      <div className="twin-workspace">
        <aside className="twin-registry">
          <div className="twin-panel-title">
            <MapPin size={14} />
            <h2>Place registry</h2>
            <span>{twin.places.length}</span>
          </div>
          <p className="twin-registry-note">Select a place to inspect its context.</p>
          {twin.places.map((place, index) => (
            <button
              key={place.id}
              className={`twin-place ${selected.id === place.id ? 'selected' : ''}`}
              aria-pressed={selected.id === place.id}
              onClick={() => select(place.id)}
            >
              <span className={`twin-number ${place.status}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{place.name}</strong>
                <small>
                  {place.provenance === 'public-reference'
                    ? 'Publicly documented'
                    : 'Proposed zone'}
                  {place.activeIncidentIds.length
                    ? ` · ${place.activeIncidentIds.length} open`
                    : ''}
                </small>
              </span>
              <ChevronRight size={12} />
            </button>
          ))}
          <div className="twin-registry-foot">
            <ShieldCheck size={15} />
            <p>Place names have sources. Layout and operational mappings need campus validation.</p>
          </div>
          <button
            className="twin-unmapped-toggle"
            aria-expanded={showUnmapped}
            onClick={() => setShowUnmapped(!showUnmapped)}
          >
            <CircleAlert size={13} />
            {twin.unmapped.length} unmapped incidents
            <ChevronRight size={13} />
          </button>
          {showUnmapped && (
            <div className="twin-unmapped">
              {twin.unmapped.map((node) => (
                <Link key={node.id} to={`/intelligence?entity=${encodeURIComponent(node.id)}`}>
                  <strong>{node.title}</strong>
                  <small>{node.location} · mapping unverified</small>
                </Link>
              ))}
              {!twin.unmapped.length && (
                <p>Every visible incident has an explicit place mapping.</p>
              )}
            </div>
          )}
        </aside>
        <section className="twin-spatial" aria-label="Campus spatial workspace">
          <div className="twin-spatial-toolbar">
            <div role="group" aria-label="Campus model layers">
              {(
                [
                  { id: 'security', label: 'Security', icon: ShieldCheck },
                  { id: 'occupancy', label: 'Occupancy', icon: Users },
                  { id: 'devices', label: 'Devices', icon: Camera },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  aria-pressed={layer === item.id}
                  onClick={() => setLayer(item.id)}
                >
                  <item.icon size={13} />
                  {item.label}
                </button>
              ))}
            </div>
            <button aria-pressed={flat} onClick={() => setFlat(!flat)}>
              <Layers3 size={13} />
              {flat ? 'Plan view' : 'Model view'}
            </button>
          </div>
          <CampusScene
            places={scenes}
            selected={selected.id}
            layer={layer}
            onSelect={select}
            flat={flat}
          />
          <div className="twin-replay">
            <div className="twin-replay-top">
              <div>
                <Clock3 size={15} />
                <strong>Scenario replay</strong>
                <span>SIMULATION</span>
              </div>
              <label>
                Exercise
                <select
                  aria-label="Campus exercise"
                  value={scenario}
                  onChange={(event) => changeScenario(event.target.value)}
                >
                  {twin.scenarios.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p>{twin.replay.exercise.description}</p>
            <div className="twin-replay-slider">
              <span>
                {formatTime(twin.replay.at)}
                <small>EAT · {formatShiftDate(twin.replay.at)}</small>
              </span>
              <label>
                <input
                  type="range"
                  aria-label="Campus replay minute"
                  min="0"
                  max="30"
                  step="1"
                  value={minute}
                  onInput={(event) => setMinute(Number(event.currentTarget.value))}
                />
                <span>
                  Start <b>Minute {minute} / 30</b> End
                </span>
              </label>
            </div>
            <p className="twin-replay-note">
              Replay changes exercise readings only. Stored incidents and evidence keep their
              recorded timestamps.
            </p>
          </div>
        </section>
        <aside className="twin-inspector">
          <div className="twin-panel-title">
            <DoorOpen size={14} />
            <h2>Place context</h2>
            <span>0{twin.places.findIndex((place) => place.id === selected.id) + 1}</span>
          </div>
          <div className="twin-inspector-heading">
            <span className={`twin-state ${selected.status}`}>
              {selected.status === 'stale'
                ? 'Sample feed stale'
                : selected.status === 'attention'
                  ? 'Exercise attention'
                  : 'Sample nominal'}
            </span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <span className="twin-place-provenance">
              <Check size={12} />
              {selected.provenance === 'public-reference'
                ? 'Name supported by a public reference'
                : 'Proposed operational zone'}
            </span>
          </div>
          <div className="twin-readings">
            <h3>
              Exercise readings <span>SIMULATED</span>
            </h3>
            {selected.readings.map((reading) => (
              <div className={`twin-reading ${reading.state}`} key={reading.id}>
                <span>
                  {reading.label}
                  <small>
                    {formatTime(reading.sampledAt)} EAT ·{' '}
                    {reading.state === 'stale' ? 'stale exercise sample' : 'exercise sample'}
                  </small>
                </span>
                <strong>
                  {reading.value ?? '—'}
                  <small>{reading.unit}</small>
                </strong>
              </div>
            ))}
            <p>Aggregate estimates; capacities, devices and thresholds are illustrative.</p>
          </div>
          <div className="twin-records">
            <h3>
              Linked records{' '}
              <span>{selected.recordIds.filter((id) => !id.startsWith('location:')).length}</span>
            </h3>
            {incidentNodes.map((node) => (
              <Link key={node.id} to={`/command?incident=${encodeURIComponent(node.recordId)}`}>
                <span className={`twin-record-dot ${node.properties.severity}`} />
                <span>
                  <strong>{node.title}</strong>
                  <small>
                    {formatShiftDate(node.recordedAt)} · {node.properties.status}
                  </small>
                </span>
                <ArrowUpRight size={12} />
              </Link>
            ))}
            {evidenceNodes.length > 0 && (
              <Link to={placeHref}>
                <Database size={14} />
                <span>
                  {evidenceNodes.length} linked evidence record
                  {evidenceNodes.length === 1 ? '' : 's'}
                </span>
                <ArrowRight size={12} />
              </Link>
            )}
            {missions.map((node) => (
              <Link key={node.id} to={`/missions?mission=${encodeURIComponent(node.recordId)}`}>
                <ShieldCheck size={14} />
                <span>
                  <strong>{node.title}</strong>
                  <small>Response mission · {node.properties.status}</small>
                </span>
                <ArrowUpRight size={12} />
              </Link>
            ))}
            {!incidentNodes.length && (
              <p>
                No stored incident is mapped to this place. Exercise events do not create incident
                records.
              </p>
            )}
            <Link className="twin-inspect-link" to={placeHref}>
              <Network size={13} />
              Explore place connections
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="twin-place-sources">
            <h3>Campus references</h3>
            {selected.recordIds.length > 0 && (
              <p className="twin-mapping-note">
                Links use configured location aliases, which still need campus approval.
              </p>
            )}
            {twin.sources
              .filter((source) => selected.sourceIds.includes(source.id))
              .map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  <span>
                    {source.title}
                    <small>Checked {source.checkedAt}</small>
                  </span>
                  <ArrowUpRight size={12} />
                </a>
              ))}
          </div>
        </aside>
      </div>
      <div className="twin-bottom">
        <section className="twin-reasoning">
          <div className="twin-panel-title">
            <Sparkles size={15} />
            <h2>NOVA response brief</h2>
            <span>LOCAL RULES</span>
          </div>
          <p>
            Exercise guidance for {twin.replay.exercise.name.toLowerCase()}. A person verifies every
            operational decision.
          </p>
          {twin.recommendations.map((item, index) => (
            <article key={item.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <div>
                  {item.basisIds.slice(0, 4).map((id) => (
                    <Link key={id} to={`/intelligence?entity=${encodeURIComponent(id)}`}>
                      {graph.nodes.find((node) => node.id === id)?.title ?? id}
                      <ArrowUpRight size={10} />
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
          <small>
            YOLOv8n is a placeholder. The brief uses deterministic rules and cited model context.
          </small>
        </section>
        <section className="twin-events">
          <div className="twin-panel-title">
            <Clock3 size={15} />
            <h2>Exercise timeline</h2>
            <span>{twin.events.length}</span>
          </div>
          <p>Fictional events at the scenario’s focus place.</p>
          {twin.events.map((event) => (
            <article key={event.minute}>
              <time>
                {formatTime(event.at)}
                <small>EAT</small>
              </time>
              <div>
                <h3>
                  {event.title}
                  <span>SIM</span>
                </h3>
                <p>{event.detail}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
      <footer className="twin-footnote">
        <MapPin size={14} />
        <p>
          Strathmore’s{' '}
          <a href="https://strathmore.edu/student-life/" target="_blank" rel="noreferrer">
            student life page
          </a>{' '}
          confirms accommodation is off campus. Legacy residence records are excluded from this
          twin. A campus survey is needed for building footprints, entrances and response routes.
        </p>
      </footer>
    </div>
  )
}
