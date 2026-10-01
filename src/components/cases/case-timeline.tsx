import { Clock3, FileText } from 'lucide-react'
import { formatShiftDate, formatTime } from '@/lib/operations'
import type { CaseTimelineEvent } from '@/types/domain'

export function CaseTimeline({ events }: { events: CaseTimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <h2>Case timeline</h2>
          <p>Every decision and handover, in order.</p>
        </div>
        <Clock3 size={17} className="muted" />
      </div>
      <div className="case-timeline">
        {sorted.map((event) => (
          <article key={event.id}>
            <span className="timeline-node">
              <FileText size={14} />
            </span>
            <div>
              <time>
                {formatShiftDate(event.timestamp)} · {formatTime(event.timestamp)} EAT
              </time>
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
              <span>{event.operator}</span>
            </div>
          </article>
        ))}
        {!events.length && <div className="empty-state">No timeline events recorded.</div>}
      </div>
    </section>
  )
}
