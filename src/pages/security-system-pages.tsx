import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Camera,
  ChevronRight,
  CircleDashed,
  Cpu,
  Database,
  Layers3,
  ScanLine,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { playbooks } from '../../shared/security-engine.js'
import { visionEngineStatus } from '../../shared/vision-engine.js'
import { useMockApi } from '@/lib/env'
import { useSecurityOS } from '@/hooks/use-security-os'
import { ErrorPanel } from '@/components/shared/async-state'

export function PlaybooksPage() {
  const [id, setId] = useState(playbooks[0].id)
  const selected = playbooks.find((item) => item.id === id)!
  return (
    <div className="os-page">
      <div className="os-heading">
        <div>
          <p className="eyebrow">NOVA SECURITY OS / PROCEDURES</p>
          <h1>Response playbooks</h1>
          <p>Consistent procedures turn evidence into an accountable human response.</p>
        </div>
        <span className="os-mini-badge">
          <BookOpen size={14} />
          {playbooks.length} built-in procedures
        </span>
      </div>
      <div className="os-playbooks-layout">
        <aside className="os-playbook-list">
          {playbooks.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected.id === item.id}
              onClick={() => setId(item.id)}
            >
              <span className="os-kicker">{item.category}</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div>
                <small>{item.steps.length} ordered steps</small>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </aside>
        <section className="workspace-panel os-playbook-detail">
          <div className="panel-header">
            <div>
              <p className="eyebrow">BUILT-IN / HUMAN-LED</p>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
            </div>
            <BookOpen size={23} />
          </div>
          <div className="os-mission-body">
            <div className="os-uncertainty">
              <ShieldCheck size={17} />
              <div>
                <strong>Review before use</strong>
                <p>
                  These are starter procedures. A supervisor reviews each mission against the campus
                  response policy before approval.
                </p>
              </div>
            </div>
            <div className="os-procedure">
              {selected.steps.map((step, index) => (
                <div key={step.id}>
                  <span className="os-step-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                    <small>{step.owner}</small>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/command" className="os-mission-link">
              Assess an incident with its matched playbook <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export function SystemsPage() {
  const { data, error } = useSecurityOS()
  const engine = data?.engine ?? visionEngineStatus
  const stages = [
    {
      icon: Camera,
      title: 'Camera ingestion',
      status: 'Disconnected',
      detail:
        'Sample snapshots only. No RTSP stream, camera credentials, or live feed is connected.',
    },
    {
      icon: ScanLine,
      title: 'YOLOv8n inference',
      status: 'Placeholder',
      detail: 'Reads labeled object metadata. No weights are downloaded and no inference runs.',
    },
    {
      icon: Layers3,
      title: 'Evidence correlation',
      status: 'Available',
      detail:
        'Assembles incident, snapshot, and permitted case records. Flags missing sources and camera mismatches.',
    },
    {
      icon: Workflow,
      title: 'Response workflow',
      status: 'Available',
      detail:
        'Matched playbooks, supervisor approval, ordered outcome recording, and activity history.',
    },
  ]
  return (
    <div className="os-page">
      <div className="os-heading">
        <div>
          <p className="eyebrow">NOVA SECURITY OS / PLATFORM</p>
          <h1>Systems & readiness</h1>
          <p>A clear view of what is connected, what is working, and what comes next.</p>
        </div>
        <span className="os-mini-badge">
          {useMockApi ? 'Browser sample mode' : 'Authenticated API mode'}
        </span>
      </div>
      {error && <ErrorPanel message={error} />}
      <section className="os-engine-banner">
        <div className="os-engine-mark">
          <Cpu size={28} />
        </div>
        <div className="os-engine-copy">
          <span className="os-kicker">OPEN-SOURCE VISION FOUNDATION</span>
          <h2>
            {engine.model}
            <span className="os-placeholder">Placeholder</span>
          </h2>
          <p>{engine.detail}</p>
        </div>
        <div className="os-systems-flags">
          <span>
            <CircleDashed size={14} />
            Inference disconnected
          </span>
          <span>
            <CircleDashed size={14} />
            Live cameras disconnected
          </span>
        </div>
      </section>
      <div className="os-systems-pipeline">
        {stages.map((stage, index) => (
          <section className="workspace-panel" key={stage.title}>
            <div className="os-stage-heading">
              <stage.icon size={24} />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h2>{stage.title}</h2>
            <span className={`os-stage-status ${stage.status === 'Available' ? 'available' : ''}`}>
              {stage.status}
            </span>
            <p>{stage.detail}</p>
          </section>
        ))}
      </div>
      <div className="os-systems-bottom">
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Operating boundaries</h2>
              <p>Current platform capabilities</p>
            </div>
            <ShieldCheck size={20} />
          </div>
          <dl className="os-system-facts">
            <div>
              <dt>Decision authority</dt>
              <dd>Supervisor or admin approval</dd>
            </div>
            <div>
              <dt>Inference provenance</dt>
              <dd>Sample metadata · inference not performed</dd>
            </div>
            <div>
              <dt>Identity analysis</dt>
              <dd>No face recognition or identity inference</dd>
            </div>
            <div>
              <dt>Physical controls</dt>
              <dd>Radio, gates, and access systems disconnected</dd>
            </div>
            <div>
              <dt>Assessment validity</dt>
              <dd>15 minutes · recheck source changes before approval</dd>
            </div>
          </dl>
        </section>
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Workspace storage</h2>
              <p>{useMockApi ? 'Saved in this browser' : 'Atomic local API database'}</p>
            </div>
            <Database size={20} />
          </div>
          <div className="os-storage-stats">
            <div>
              <strong>{data?.runs.length ?? '—'}</strong>
              <span>assessments / 500</span>
            </div>
            <div>
              <strong>{data?.missions.length ?? '—'}</strong>
              <span>missions / 500</span>
            </div>
          </div>
          <p className="os-system-copy">
            {useMockApi
              ? 'Use this mode to review sample workflows. Shared-device production operations require the authenticated API and managed storage.'
              : 'API sessions, role checks, CSRF protection, and atomic records are active. Multi-site production requires managed database storage and campus integration.'}
          </p>
          <Link className="os-rail-footer" to="/command">
            Return to Command <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  )
}
