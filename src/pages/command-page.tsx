import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Cpu,
  Layers3,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { api } from '@/api'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { SourceReview } from '@/components/security/source-review'
import { useOperations } from '@/hooks/use-operations'
import { useSecurityOS } from '@/hooks/use-security-os'
import { useAuth } from '@/lib/auth'
import {
  formatShiftDate,
  formatTime,
  isActiveAlert,
  notifyOperationsChanged,
  sortAlerts,
  statusLabels,
} from '@/lib/operations'
import {
  buildContext,
  playbooks,
  type EngineRun,
  type EngineSource,
} from '../../shared/security-engine.js'
import { placeholderVision } from '../../shared/vision-engine.js'

const intents = [
  { id: 'assess', title: 'Assess incident', detail: 'Sources & unknowns' },
  { id: 'response', title: 'Plan response', detail: 'Review the procedure' },
  { id: 'handover', title: 'Prepare handover', detail: 'Context for the next shift' },
]

export function CommandPage() {
  const { data, error, isLoading } = useOperations()
  const security = useSecurityOS()
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const [intent, setIntent] = useState('assess')
  const [busy, setBusy] = useState('')
  const [failure, setFailure] = useState('')
  const [localRun, setLocalRun] = useState<EngineRun | null>(null)
  const [selectedSource, setSelectedSource] = useState<EngineSource | null>(null)
  const [frameId, setFrameId] = useState('')
  const [failedSnapshot, setFailedSnapshot] = useState('')
  if (isLoading && !data) return <LoadingPanel />
  if (!data || error) return <ErrorPanel message={error ?? 'Unable to load records.'} />
  const active = sortAlerts(data.alerts.filter(isActiveAlert))
  const incident =
    data.alerts.find((item) => item.id === params.get('incident')) ??
    active[0] ??
    sortAlerts(data.alerts)[0]
  const pending =
    security.data?.missions.filter((item) => item.status === 'pending-approval').length ?? 0
  const run =
    localRun?.context.incident.id === incident?.id
      ? localRun
      : security.data?.runs.find((item) => item.context.incident.id === incident?.id)
  const context = run?.context ?? (incident ? buildContext(data, incident.id, session?.role) : null)
  const frames = run?.vision ?? (incident ? placeholderVision(data, incident.id) : [])
  const frame = frames.find((item) => item.evidenceId === frameId) ?? frames[0]
  const playbook = playbooks.find((item) => item.id === context?.playbookId)
  const mission =
    security.data?.missions.find(
      (item) =>
        item.incidentId === incident?.id &&
        ['pending-approval', 'active', 'paused'].includes(item.status),
    ) ?? security.data?.missions.find((item) => item.runId === run?.id)
  async function assess() {
    if (!incident || busy) return
    setBusy('assessment')
    setFailure('')
    try {
      const result = await api.runAssessment({ incidentId: incident.id, intent })
      setLocalRun(result)
      notifyOperationsChanged()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Assessment could not be saved.')
    } finally {
      setBusy('')
    }
  }
  async function prepare() {
    if (!run || busy) return
    setBusy('mission')
    setFailure('')
    try {
      await api.proposeMission(run.id)
      notifyOperationsChanged()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Mission could not be saved.')
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="os-page">
      <div className="os-heading">
        <div>
          <p className="eyebrow">NOVA SECURITY OS / COMMAND</p>
          <h1>Understand. Decide. Respond.</h1>
          <p>Your incident context, vision evidence, and next move—in one place.</p>
        </div>
        <Link to="/missions" className="os-quiet-link">
          <Workflow size={16} />
          Mission control <ArrowUpRight size={14} />
        </Link>
      </div>
      <section className="os-engine-banner" aria-label="Engine readiness">
        <div className="os-engine-mark">
          <ScanLine size={28} />
        </div>
        <div className="os-engine-copy">
          <span className="os-kicker">VISION ENGINE</span>
          <h2>
            YOLOv8n<span className="os-placeholder">Placeholder</span>
          </h2>
          <p>
            Sample detections power the workflow preview. Model inference and live cameras are
            disconnected.
          </p>
        </div>
        <div className="os-pipeline-mini">
          <span>
            <Camera size={15} />
            Sample snapshots
          </span>
          <ChevronRight size={15} />
          <span>
            <Cpu size={15} />
            Detection metadata
          </span>
          <ChevronRight size={15} />
          <span>
            <ShieldCheck size={15} />
            Human decision
          </span>
        </div>
      </section>
      <div className="os-status-strip">
        <div>
          <span className="severity-dot high" />
          <strong>{active.length}</strong>
          <span>open incidents</span>
        </div>
        <Link to="/missions">
          <Workflow size={15} />
          <strong>{pending}</strong>
          <span>awaiting approval</span>
          <ArrowRight size={13} />
        </Link>
        <div>
          <Layers3 size={15} />
          <strong>{data.evidence.length}</strong>
          <span>sample snapshots</span>
        </div>
        <div className="os-status-note">
          Campus records · recorded {incident ? formatShiftDate(incident.createdAt) : '—'}
        </div>
      </div>
      {(failure || security.error) && (
        <div className="os-error" role="alert">
          <CircleAlert size={17} />
          {failure || security.error}
        </div>
      )}
      <div className="os-command-grid">
        <aside className="workspace-panel os-incident-rail">
          <div className="panel-header">
            <div>
              <h2>Focus queue</h2>
              <p>Select an incident to assess</p>
            </div>
            <span className="panel-meta">{active.length}</span>
          </div>
          <div className="os-focus-list">
            {active.map((item) => (
              <button
                key={item.id}
                className={item.id === incident?.id ? 'selected' : ''}
                aria-pressed={item.id === incident?.id}
                onClick={() => {
                  setParams({ incident: item.id })
                  setLocalRun(null)
                  setFailure('')
                  setFrameId('')
                }}
              >
                <div>
                  <span className={`severity-dot ${item.severity}`} />
                  <span>{item.severity}</span>
                  <small>{formatTime(item.createdAt)}</small>
                </div>
                <strong>{item.title}</strong>
                <span className="os-focus-location">
                  <MapPin size={12} />
                  {item.zone}
                </span>
                <span className="os-focus-owner">
                  {item.assignee}
                  <ChevronRight size={13} />
                </span>
              </button>
            ))}
            {!active.length && (
              <div className="empty-state">
                No open incidents. Select a historical record from Alerts for review.
              </div>
            )}
          </div>
          <Link to="/alerts" className="os-rail-footer">
            All incidents <ArrowUpRight size={14} />
          </Link>
        </aside>
        <div className="os-context-column">
          {incident && context ? (
            <>
              <section className="workspace-panel os-incident-context">
                <div className="os-context-header">
                  <span className={`signal-badge signal-${incident.severity}`}>
                    {incident.severity} priority
                  </span>
                  <span className="mono muted">{incident.id}</span>
                </div>
                <h2>{incident.title}</h2>
                <p>{incident.summary}</p>
                <div className="os-context-meta">
                  <span>
                    <MapPin size={14} />
                    {incident.zone}
                  </span>
                  <span>{statusLabels[incident.status]}</span>
                  <span>{incident.assignee}</span>
                </div>
              </section>
              <section className="workspace-panel os-vision-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      <ScanLine size={16} />
                      Vision evidence
                    </h2>
                    <p>Annotated sample metadata · inference not performed</p>
                  </div>
                  <span className="os-mini-badge">YOLOv8n</span>
                </div>
                {frame ? (
                  <>
                    <figure className="os-vision-frame">
                      {failedSnapshot === frame.snapshotUrl && (
                        <div className="os-snapshot-missing">
                          <Camera size={24} />
                          <span>Snapshot unavailable · metadata retained</span>
                        </div>
                      )}
                      <img
                        src={frame.snapshotUrl}
                        alt={`Sample evidence from ${frame.cameraId}`}
                        onError={(event) => {
                          event.currentTarget.style.visibility = 'hidden'
                          setFailedSnapshot(frame.snapshotUrl)
                        }}
                      />
                      {frame.detections.map((detection) => (
                        <div
                          key={detection.id}
                          className="os-detection-box"
                          style={{
                            left: `${detection.bbox.x * 100}%`,
                            top: `${detection.bbox.y * 100}%`,
                            width: `${detection.bbox.width * 100}%`,
                            height: `${detection.bbox.height * 100}%`,
                          }}
                        >
                          <span>
                            {detection.label} · {Math.round(detection.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                      <figcaption>
                        <Camera size={13} />
                        {frame.cameraId}
                        <span>{formatTime(frame.recordedAt)} EAT · sample</span>
                      </figcaption>
                    </figure>
                    <div className="os-detection-legend">
                      <span className="os-kicker">LABELED OBJECTS</span>
                      {frame.detections.map((item) => (
                        <span key={item.id}>
                          {item.label}
                          <small>{Math.round(item.confidence * 100)}%</small>
                        </span>
                      ))}
                      {!frame.detections.length && <span>No object labels in this source</span>}
                    </div>
                    {frames.length > 1 && (
                      <div className="os-frame-tabs">
                        {frames.map((item, index) => (
                          <button
                            key={item.evidenceId}
                            onClick={() => setFrameId(item.evidenceId)}
                            aria-pressed={frame.evidenceId === item.evidenceId}
                          >
                            Snapshot {index + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <Camera size={28} />
                    <strong>No linked snapshot</strong>
                    <p>The assessment will flag this evidence gap.</p>
                  </div>
                )}
              </section>
              <section className="workspace-panel">
                <div className="panel-header">
                  <div>
                    <h2>Source records</h2>
                    <p>{context.sources.length} records assembled for this incident</p>
                  </div>
                  <Layers3 size={17} />
                </div>
                <div className="os-source-list">
                  {context.sources.map((source) => (
                    <button key={source.id} onClick={() => setSelectedSource(source)}>
                      <span className="os-source-icon">
                        {source.kind === 'evidence' ? <Camera size={15} /> : <Layers3 size={15} />}
                      </span>
                      <div>
                        <strong>{source.title}</strong>
                        <small>
                          {source.kind} · {source.id}
                        </small>
                      </div>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="workspace-panel empty-state">No incident records available.</div>
          )}
        </div>
        <section className="workspace-panel os-assessment">
          <div className="os-assessment-heading">
            <span className="os-engine-orb">
              <Sparkles size={18} />
            </span>
            <div>
              <h2>Response intelligence</h2>
              <p>Source-led workflow preview</p>
            </div>
            <span className="os-mini-badge">SAMPLE</span>
          </div>
          <div className="os-assessment-body">
            <p className="os-assessment-intro">
              Turn the selected incident into a reviewable next step.
            </p>
            <div className="os-intents" aria-label="Assessment intent">
              {intents.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={intent === item.id}
                  onClick={() => setIntent(item.id)}
                  disabled={!!busy}
                >
                  <span>{item.title}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
            <Button
              className="os-run-button"
              onClick={assess}
              disabled={!incident || !!busy || !!security.error}
            >
              <ScanLine size={16} />
              {busy === 'assessment' ? 'Assembling assessment…' : 'Run sample assessment'}
              <ArrowRight size={15} />
            </Button>
            {run ? (
              <div className="os-assessment-result">
                <div className="os-result-label">
                  <Check size={14} />
                  Saved assessment<span>{formatTime(run.createdAt)} EAT</span>
                </div>
                <h3>
                  {run.intent === 'handover'
                    ? 'Handover context'
                    : run.intent === 'response'
                      ? 'Suggested response'
                      : 'Situation assessment'}
                </h3>
                <p className="os-result-summary">{run.assessment.summary}</p>
                <p className="section-label">WHAT THE RECORDS SAY</p>
                <div className="os-observations">
                  {run.assessment.observations.map((observation, index) => (
                    <div key={index}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <p>{observation.text}</p>
                        <div className="os-citations">
                          {observation.sourceIds.map((id) => (
                            <button
                              key={id}
                              onClick={() =>
                                setSelectedSource(
                                  run.context.sources.find((source) => source.id === id) ?? null,
                                )
                              }
                            >
                              {id}
                              <ArrowUpRight size={10} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="os-uncertainty">
                  <CircleAlert size={16} />
                  <div>
                    <strong>Needs human verification</strong>
                    {run.assessment.uncertainties.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="os-assessment-empty">
                <Layers3 size={25} />
                <strong>Context first. Action second.</strong>
                <p>
                  Run an assessment to review the recorded observations, evidence gaps, and
                  suggested procedure.
                </p>
              </div>
            )}
            {playbook && (
              <div className="os-recommended">
                <div className="os-recommended-title">
                  <BookOpen size={15} />
                  <span>{playbook.name}</span>
                  <Link to="/playbooks" aria-label="View response playbooks">
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
                <ol>
                  {playbook.steps
                    .filter((step) => !run || run.assessment.recommendedStepIds.includes(step.id))
                    .map((step) => (
                      <li key={step.id}>
                        <span>{step.title}</span>
                        <small>{step.owner}</small>
                      </li>
                    ))}
                </ol>
                {mission ? (
                  <Link
                    to={`/missions?mission=${encodeURIComponent(mission.id)}`}
                    className="os-mission-link"
                  >
                    <Workflow size={15} />
                    Review prepared mission <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="os-prepare-button"
                    disabled={!run || !!busy || !incident || !isActiveAlert(incident)}
                    onClick={prepare}
                  >
                    <Workflow size={15} />
                    {busy === 'mission' ? 'Saving mission…' : 'Prepare mission for approval'}
                  </Button>
                )}
                <p className="os-action-note">
                  A supervisor approves the procedure. Operators perform and record the steps.
                </p>
              </div>
            )}
          </div>
          <div className="os-assessment-footer">
            <ShieldCheck size={13} />
            Placeholder output · no automated dispatch
          </div>
        </section>
      </div>
      <SourceReview source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  )
}
