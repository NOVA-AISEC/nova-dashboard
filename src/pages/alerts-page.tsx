import { useState } from 'react'
import { AlertTable } from '@/components/ops/alert-table'
import { FiltersBar } from '@/components/shared/filters-bar'
import { MetricCard } from '@/components/shared/metric-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Button } from '@/components/ui/button'
import { alerts } from '@/data/mock-data'

export function AlertsPage() {
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severity === 'all' || alert.severity === severity
    const matchesStatus = status === 'all' || alert.status === status
    const haystack =
      `${alert.id} ${alert.title} ${alert.area} ${alert.summary} ${alert.rule}`.toLowerCase()
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
    return matchesSeverity && matchesStatus && matchesQuery
  })

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Event queue"
        title="Alert review queue"
        description="Filter by severity and response state, then open the linked case workspace for evidence review."
        actions={<Button variant="outline">Shift handoff notes</Button>}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          label="Critical open"
          value={String(
            alerts.filter((alert) => alert.severity === 'critical').length,
          ).padStart(2, '0')}
          delta="Immediate analyst review"
          tone="warning"
        />
        <MetricCard
          label="Triaging"
          value={String(
            alerts.filter((alert) => alert.status === 'triaging').length,
          ).padStart(2, '0')}
          delta="Analyst-owned work"
          tone="accent"
        />
        <MetricCard
          label="Contained"
          value={String(
            alerts.filter((alert) => alert.status === 'contained').length,
          ).padStart(2, '0')}
          delta="Watchlist follow-up only"
          tone="success"
        />
      </section>

      <FiltersBar
        searchValue={query}
        onSearchChange={setQuery}
        groups={[
          {
            id: 'severity',
            label: 'Severity',
            value: severity,
            options: [
              { label: 'All', value: 'all' },
              { label: 'Critical', value: 'critical' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: status,
            options: [
              { label: 'All', value: 'all' },
              { label: 'New', value: 'new' },
              { label: 'Triaging', value: 'triaging' },
              { label: 'Contained', value: 'contained' },
              { label: 'Closed', value: 'closed' },
            ],
          },
        ]}
        onGroupChange={(groupId, value) => {
          if (groupId === 'severity') {
            setSeverity(value)
          }

          if (groupId === 'status') {
            setStatus(value)
          }
        }}
      />

      <AlertTable
        alerts={filteredAlerts}
        title="Filtered queue"
        description="Open a case to inspect its snapshots, metadata, and timeline."
      />
    </div>
  )
}
