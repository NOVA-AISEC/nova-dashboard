import { useState } from 'react'
import { Camera, ShieldCheck } from 'lucide-react'
import { formatShiftDate, formatTime } from '@/lib/operations'
import type { Evidence } from '@/types/domain'

export function EvidenceViewer({ snapshots }: { snapshots: Evidence[] }) {
  const [selectedId, setSelectedId] = useState('')
  const selected = snapshots.find((item) => item.id === selectedId) ?? snapshots[0]
  if (!selected)
    return (
      <div className="workspace-panel empty-state">
        <Camera size={30} />
        <strong>No evidence linked yet</strong>
        <p>This case has no snapshot records.</p>
      </div>
    )
  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
        </div>
        <span className="panel-meta">Sample evidence</span>
      </div>
      <div className="evidence-workspace">
        <div>
          <figure className="evidence-main-image">
            <img src={selected.snapshotUrl} alt={selected.title} />
            <figcaption>
              <Camera size={13} />
              {selected.metadata.cameraId}
              <span>{formatTime(selected.metadata.ts)} EAT</span>
            </figcaption>
          </figure>
          <div className="evidence-thumbnails">
            {snapshots.map((item) => (
              <button
                aria-pressed={item.id === selected.id}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <img src={item.snapshotUrl} alt={item.title} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
        <aside className="evidence-metadata">
          <h3>Source metadata</h3>
          <dl>
            {[
              { label: 'Camera', value: selected.metadata.cameraId },
              { label: 'Location', value: selected.metadata.zone },
              {
                label: 'Recorded',
                value: `${formatShiftDate(selected.metadata.ts)} · ${formatTime(selected.metadata.ts)} EAT`,
              },
              { label: 'Retention', value: selected.retention },
              { label: 'Chain of custody', value: selected.chainOfCustody },
              { label: 'Redactions', value: selected.redactions },
              {
                label: 'Detected objects',
                value: `${selected.metadata.classes.join(', ')} · ${Math.round(selected.metadata.confidence * 100)}% confidence`,
              },
            ].map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="notice-panel">
            <ShieldCheck size={16} />
            <p>Snapshots and metadata only. Confirm detections through human review.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
