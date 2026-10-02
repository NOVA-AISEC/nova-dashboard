import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Expand,
  GitBranch,
  Layers3,
  Network,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react'
import { api } from '@/api'
import { EntityGraph } from '@/components/intelligence/entity-graph'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { useIntelligence } from '@/hooks/use-intelligence'
import { formatShiftDate, formatTime, notifyOperationsChanged } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'
import {
  entityKinds,
  neighborhood,
  type EntityKind,
  type IntelligenceAnswer,
  type QueryMode,
} from '../../shared/intelligence-engine'

const kinds: Record<EntityKind, string> = {
  incident: 'Incidents',
  evidence: 'Evidence',
  case: 'Cases',
  camera: 'Cameras',
  location: 'Locations',
  team: 'Teams',
  assessment: 'Assessments',
  mission: 'Missions',
}
const questions: { mode: QueryMode; label: string; question: string }[] = [
  {
    mode: 'connections',
    label: 'Trace connections',
    question: 'What records are connected to this entity?',
  },
  { mode: 'evidence', label: 'Review evidence', question: 'What evidence supports this entity?' },
  {
    mode: 'gaps',
    label: 'Find verification gaps',
    question: 'What is missing or needs verification?',
  },
  {
    mode: 'timeline',
    label: 'Build a timeline',
    question: 'Show the recorded timeline for this entity.',
  },
  { mode: 'response', label: 'Review response', question: 'What response work has been prepared?' },
]
function EntityGlyph({ kind }: { kind: EntityKind }) {
  return (
    <span className={`intel-glyph kind-${kind}`}>
      {kind === 'incident' ? (
        <Target size={14} />
      ) : kind === 'evidence' ? (
        <Layers3 size={14} />
      ) : kind === 'mission' ? (
        <Workflow size={14} />
      ) : (
        <Database size={14} />
      )}
    </span>
  )
}
export function IntelligencePage() {
  const { data: graph, error, isLoading, refresh } = useIntelligence()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<EntityKind | 'all'>('incident')
  const [view, setView] = useState('graph')
  const [depth, setDepth] = useState(1)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<IntelligenceAnswer | null>(null)
  const [answerGraph, setAnswerGraph] = useState('')
  const requestVersion = useRef(0)
  const [busy, setBusy] = useState('')
  const [failure, setFailure] = useState('')
  const [inspector, setInspector] = useState('entity')
  if (isLoading && !graph) return <LoadingPanel lines={12} />
  if (error || !graph) return <ErrorPanel message={error ?? 'Intelligence unavailable.'} />
  const selected =
    graph.nodes.find((node) => node.id === params.get('entity')) ??
    graph.nodes.find(
      (node) =>
        node.kind === 'incident' &&
        node.properties.severity === 'critical' &&
        node.properties.status === 'new',
    ) ??
    graph.nodes[0]
  if (!selected)
    return (
      <div className="empty-state">
        <Network size={32} />
        <h1>No records to connect yet</h1>
        <p>Incidents and evidence will appear here when records are available.</p>
        <Link to="/alerts">Open incidents</Link>
      </div>
    )
  const query = search.trim().toLowerCase()
  const matches = graph.nodes.filter(
    (node) =>
      (kind === 'all' || node.kind === kind) &&
      `${node.recordId} ${node.title} ${node.detail} ${Object.values(node.properties).join(' ')}`
        .toLowerCase()
        .includes(query),
  )
  const visibleAnswer =
    answer?.anchorId === selected.id && answerGraph === graph.generatedAt ? answer : null
  const context = neighborhood(graph, selected.id, depth)
  const contextIds = new Set(context.nodes.map((node) => node.id))
  const related = graph.edges.filter(
    (edge) => edge.source === selected.id || edge.target === selected.id,
  )
  const gaps = graph.gaps.filter((gap) => gap.sourceIds.includes(selected.id))
  const snapshots = context.nodes.filter((node) => node.kind === 'evidence')
  const timeline = graph.timeline.filter((event) =>
    event.sourceIds.some((id) => contextIds.has(id)),
  )
  const openIncidents = graph.nodes.filter(
    (node) => node.kind === 'incident' && !['closed', 'contained'].includes(node.properties.status),
  )
  const critical = openIncidents.filter((node) => node.properties.severity === 'critical')
  const pending = graph.nodes.filter(
    (node) => node.kind === 'mission' && node.properties.status === 'pending-approval',
  )
  function select(id: string) {
    requestVersion.current++
    setParams({ entity: id })
    setAnswer(null)
    setFailure('')
    setQuestion('')
  }
  async function ask(text: string, mode?: QueryMode) {
    if (!text.trim() || busy || !selected) return
    setQuestion(text)
    setBusy('query')
    setFailure('')
    const version = ++requestVersion.current
    try {
      const result = await api.askIntelligence({
        question: text,
        nodeId: selected.id,
        ...(mode ? { mode } : {}),
      })
      if (version === requestVersion.current) {
        setAnswer(result)
        setAnswerGraph(graph!.generatedAt)
      }
    } catch (error) {
      if (version === requestVersion.current)
        setFailure(error instanceof Error ? error.message : 'Query could not be completed.')
    } finally {
      setBusy('')
    }
  }
  async function assess() {
    if (!selected || selected.kind !== 'incident' || busy) return
    setBusy('assessment')
    setFailure('')
    try {
      await api.runAssessment({ incidentId: selected.recordId, intent: 'assess' })
      notifyOperationsChanged()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Assessment could not be saved.')
    } finally {
      setBusy('')
    }
  }
  function citation(id: string, index: number) {
    const source = graph!.nodes.find((node) => node.id === id)
    return source ? (
      <button
        key={id}
        className="intel-citation"
        title={source.title}
        onClick={() => select(id)}
        aria-label={`Inspect source ${source.recordId}`}
      >
        [{index + 1}]{' '}
        {source.recordId.length > 24 ? `${source.recordId.slice(0, 22)}…` : source.recordId}
      </button>
    ) : null
  }
  function exportContext() {
    downloadFile(
      'nova-intelligence-brief.json',
      JSON.stringify(
        {
          title: selected.title,
          generatedAt: new Date().toISOString(),
          engine: graph!.engine,
          selected: selected.id,
          depth,
          context,
          verificationGaps: graph!.gaps.filter((gap) =>
            gap.sourceIds.every((id) => contextIds.has(id)),
          ),
          answer: visibleAnswer,
          citedSources: graph!.nodes.filter((node) => visibleAnswer?.sourceIds.includes(node.id)),
          sampleData: true,
        },
        null,
        2,
      ),
      'application/json',
    )
  }
  return (
    <div className="intel-page">
      <header className="intel-heading">
        <div>
          <p>NOVA / INTELLIGENCE WORKSPACE</p>
          <h1>
            See the connections.<span>Understand the situation.</span>
          </h1>
        </div>
        <div className="intel-heading-actions">
          <span className="intel-engine-state">
            <span /> Local query engine
          </span>
          <button onClick={exportContext}>
            <ArrowDownToLine size={14} /> Export brief
          </button>
        </div>
      </header>
      <div className="intel-summary">
        <div>
          <Network size={16} />
          <strong>{graph.nodes.length}</strong>
          <span>connected entities</span>
        </div>
        <div>
          <GitBranch size={16} />
          <strong>{graph.edges.length}</strong>
          <span>recorded relationships</span>
        </div>
        <button
          onClick={() => {
            setKind('incident')
            setSearch('critical')
          }}
        >
          <span className="intel-critical-dot" />
          <strong>{critical.length}</strong>
          <span>critical incidents</span>
        </button>
        <Link to="/missions">
          <Workflow size={16} />
          <strong>{pending.length}</strong>
          <span>awaiting approval</span>
          <ArrowUpRight size={12} />
        </Link>
        <span className="intel-summary-source">Sample workspace · YOLOv8n placeholder</span>
      </div>
      {graph.omitted > 0 && (
        <div className="intel-capacity" role="status">
          This graph is a bounded view. {graph.omitted} records or relationships were omitted; use
          the incident/case workspaces for the complete records.
        </div>
      )}
      {failure && (
        <div className="intel-failure" role="alert">
          <CircleAlert size={16} />
          {failure}
        </div>
      )}
      <div className="intel-workbench">
        <aside className="intel-entities">
          <div className="intel-panel-title">
            <h2>Object explorer</h2>
            <span>{graph.nodes.length}</span>
          </div>
          <label className="intel-search">
            <Search size={14} />
            <input
              aria-label="Search entities"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find an entity…"
            />
          </label>
          <select
            aria-label="Entity type"
            value={kind}
            onChange={(event) => setKind(event.target.value as EntityKind | 'all')}
          >
            <option value="all">All object types</option>
            {entityKinds.map((type) => (
              <option key={type} value={type}>
                {kinds[type]} · {graph.nodes.filter((node) => node.kind === type).length}
              </option>
            ))}
          </select>
          <div className="intel-entity-list" aria-label="Workspace entities">
            {matches.slice(0, 100).map((node) => (
              <button
                key={node.id}
                aria-pressed={node.id === selected.id}
                onClick={() => select(node.id)}
              >
                <EntityGlyph kind={node.kind} />
                <span>
                  <strong>{node.title}</strong>
                  <small>
                    {node.kind} ·{' '}
                    {node.kind === 'incident'
                      ? node.properties.severity
                      : node.recordId.length > 28
                        ? `${node.recordId.slice(0, 25)}…`
                        : node.recordId}
                  </small>
                </span>
                {node.properties.status === 'new' && <i />}
              </button>
            ))}
          </div>
          {!matches.length && (
            <p className="intel-small-empty">No matching entities. Try another type or search.</p>
          )}
          <div className="intel-entity-foot">
            <Database size={12} />
            {matches.length} matches{matches.length > 100 ? ' · first 100 shown' : ''}
            <button onClick={refresh} disabled={!!busy}>
              Refresh
            </button>
          </div>
        </aside>
        <section className="intel-center">
          <div className="intel-view-toolbar">
            <div role="group" aria-label="Intelligence view">
              {[
                { id: 'graph', icon: Network, label: 'Graph' },
                { id: 'evidence', icon: Layers3, label: 'Evidence' },
                { id: 'timeline', icon: Clock3, label: 'Timeline' },
              ].map((tab) => (
                <button key={tab.id} aria-pressed={view === tab.id} onClick={() => setView(tab.id)}>
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={() => setDepth(depth === 1 ? 2 : 1)}>
              <Expand size={13} />
              {depth === 1 ? '1 hop' : '2 hops'}
            </button>
          </div>
          <div className="intel-focus">
            <EntityGlyph kind={selected.kind} />
            <div>
              <small>
                {selected.kind.toUpperCase()} / {selected.recordId}
              </small>
              <h2>{selected.title}</h2>
            </div>
            <span className={`intel-severity ${selected.properties.severity ?? ''}`}>
              {selected.properties.severity ?? selected.kind}
            </span>
          </div>
          {view === 'graph' && (
            <EntityGraph
              key={selected.id}
              graph={graph}
              selected={selected}
              depth={depth}
              onSelect={select}
            />
          )}
          {view === 'evidence' && (
            <div className="intel-evidence-grid">
              {snapshots.map((node) => (
                <button key={node.id} onClick={() => select(node.id)}>
                  <img
                    src={node.properties.snapshot}
                    alt={`Sample snapshot: ${node.title}`}
                    loading="lazy"
                  />
                  <div>
                    <small>
                      {node.properties.camera} · {formatTime(node.recordedAt)} EAT
                    </small>
                    <strong>{node.title}</strong>
                    <span>{node.properties.labels}</span>
                  </div>
                </button>
              ))}
              {!snapshots.length && (
                <p className="intel-small-empty">
                  No snapshot is connected at this depth. Expand to two hops or select an incident.
                </p>
              )}
            </div>
          )}
          {view === 'timeline' && (
            <div className="intel-timeline">
              {timeline.slice(0, 60).map((event) => (
                <article key={event.id}>
                  <span className="intel-time-dot" />
                  <div>
                    <small>
                      {formatShiftDate(event.at)} · {formatTime(event.at)} EAT
                    </small>
                    <h3>{event.title}</h3>
                    <p>{event.detail}</p>
                    <div>{event.sourceIds.map(citation)}</div>
                  </div>
                </article>
              ))}
              {!timeline.length && (
                <p className="intel-small-empty">No timestamped events in this context.</p>
              )}
            </div>
          )}
          <div className="intel-analysis-strip">
            <div>
              <ShieldCheck size={16} />
              <strong>Record provenance</strong>
              <span>Every link has a recorded basis</span>
            </div>
            <div>
              <CircleAlert size={16} />
              <strong>
                {gaps.length} verification {gaps.length === 1 ? 'gap' : 'gaps'}
              </strong>
              <span>
                {gaps.length ? 'Review before a decision' : 'Check current conditions separately'}
              </span>
            </div>
          </div>
          <section className="intel-query-panel" aria-label="Source-cited intelligence queries">
            <div className="intel-query-heading">
              <div>
                <Sparkles size={17} />
                <h2>Ask NOVA</h2>
                <span>LOCAL RULES</span>
              </div>
              <small>Scoped to this entity and explicit record links</small>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void ask(question)
              }}
            >
              <input
                aria-label="Ask NOVA a question"
                value={question}
                maxLength={600}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={`Ask about ${selected.kind === 'incident' ? 'this incident' : 'this entity'}…`}
              />
              <button
                type="submit"
                aria-label="Run intelligence query"
                disabled={!!busy || !question.trim()}
              >
                {busy === 'query' ? '…' : <Send size={16} />}
              </button>
            </form>
            <div className="intel-query-suggestions">
              {questions.map((item) => (
                <button
                  key={item.mode}
                  disabled={!!busy}
                  onClick={() => void ask(item.question, item.mode)}
                >
                  {item.label}
                  <ArrowUpRight size={11} />
                </button>
              ))}
            </div>
            {visibleAnswer && (
              <div className="intel-answer" role="status">
                <div>
                  <span className={`intel-answer-status ${visibleAnswer.status}`}>
                    <Check size={12} />
                    {visibleAnswer.status === 'answered'
                      ? 'Sources retrieved'
                      : visibleAnswer.status === 'unsupported'
                        ? 'Supported queries only'
                        : 'No matching context'}
                  </span>
                  <small>{formatTime(visibleAnswer.generatedAt)} EAT</small>
                </div>
                <h3>{visibleAnswer.summary}</h3>
                {visibleAnswer.claims.map((claim, index) => (
                  <article key={index}>
                    <p>{claim.text}</p>
                    <div>{claim.sourceIds.map(citation)}</div>
                  </article>
                ))}
                <p className="intel-query-note">
                  Deterministic source retrieval. Generative AI and YOLOv8n inference are
                  placeholders; findings require operator judgment.
                </p>
              </div>
            )}
            {!visibleAnswer && (
              <p className="intel-query-note">
                Explore the record graph, inspect evidence, and retrieve answers with citations.
                Generative AI and live vision inference remain disconnected.
              </p>
            )}
          </section>
        </section>
        <aside className="intel-inspector">
          <div className="intel-inspector-tabs" role="group" aria-label="Entity inspector">
            {['entity', 'connections', 'gaps'].map((tab) => (
              <button key={tab} aria-pressed={inspector === tab} onClick={() => setInspector(tab)}>
                {tab === 'entity'
                  ? 'Details'
                  : tab === 'connections'
                    ? `Links ${related.length}`
                    : `Gaps ${gaps.length}`}
              </button>
            ))}
          </div>
          <div className="intel-inspector-heading">
            <EntityGlyph kind={selected.kind} />
            <small>{selected.kind.toUpperCase()}</small>
            <h2>{selected.title}</h2>
            <code>{selected.recordId}</code>
          </div>
          {inspector === 'entity' && (
            <>
              <p className="intel-inspector-copy">{selected.detail}</p>
              {selected.kind === 'evidence' && (
                <img
                  className="intel-inspector-image"
                  src={selected.properties.snapshot}
                  alt={`Sample snapshot: ${selected.title}`}
                />
              )}
              <dl>
                {Object.entries(selected.properties)
                  .filter(([key]) => key !== 'snapshot')
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                {selected.recordedAt && (
                  <div>
                    <dt>Recorded</dt>
                    <dd>
                      {formatShiftDate(selected.recordedAt)} · {formatTime(selected.recordedAt)} EAT
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
          {inspector === 'connections' && (
            <div className="intel-links">
              {related.slice(0, 60).map((edge) => {
                const target = graph.nodes.find(
                  (node) => node.id === (edge.source === selected.id ? edge.target : edge.source),
                )!
                return (
                  <button key={edge.id} onClick={() => select(target.id)}>
                    <small>
                      {edge.source === selected.id ? edge.relation : `Incoming · ${edge.relation}`}
                    </small>
                    <strong>
                      {target.title}
                      <ChevronRight size={13} />
                    </strong>
                    <span>{edge.basis}</span>
                  </button>
                )
              })}
              {!related.length && <p>No recorded links for this entity.</p>}
            </div>
          )}
          {inspector === 'gaps' && (
            <div className="intel-gaps">
              {gaps.map((gap) => (
                <article key={gap.id}>
                  <CircleAlert size={15} />
                  <div>
                    <h3>{gap.title}</h3>
                    <p>{gap.detail}</p>
                    <div>{gap.sourceIds.map(citation)}</div>
                  </div>
                </article>
              ))}
              {!gaps.length && (
                <p>No entity-specific gap is recorded. This does not verify current conditions.</p>
              )}
            </div>
          )}
          <div className="intel-inspector-action">
            {selected.kind === 'incident' ? (
              <>
                <button
                  disabled={!!busy || ['closed', 'contained'].includes(selected.properties.status)}
                  onClick={() => void assess()}
                >
                  <Sparkles size={15} />
                  {busy === 'assessment' ? 'Saving assessment…' : 'Run sample assessment'}
                </button>
                <Link to={`/command?incident=${encodeURIComponent(selected.recordId)}`}>
                  Open decision workspace
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : selected.kind === 'mission' ? (
              <Link to={`/missions?mission=${encodeURIComponent(selected.recordId)}`}>
                Open mission
                <ArrowRight size={14} />
              </Link>
            ) : selected.kind === 'case' ? (
              <Link to={`/cases/${encodeURIComponent(selected.recordId)}`}>
                Open case
                <ArrowRight size={14} />
              </Link>
            ) : selected.kind === 'assessment' ? (
              <Link to={`/command?incident=${encodeURIComponent(selected.properties.incident)}`}>
                Review assessment
                <ArrowRight size={14} />
              </Link>
            ) : (
              <p>Choose a connected incident to prepare a response.</p>
            )}
            <small>Human approval controls all response missions.</small>
          </div>
        </aside>
      </div>
    </div>
  )
}
