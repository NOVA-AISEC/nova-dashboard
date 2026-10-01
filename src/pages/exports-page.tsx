import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight, FileArchive } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { evidenceExports } from '@/data/mock-data'
import { useOperations } from '@/hooks/use-operations'
import { formatShiftDate } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'

export function ExportsPage() {
  const { data } = useOperations()
  function download(id: string) {
    const record = evidenceExports.find((item) => item.id === id)
    if (!record || !data) return
    const caseRecord = data.cases.find((item) => item.id === record.caseId)
    const manifest = {
      product: 'NOVA',
      workspace: 'Sample data',
      generatedAt: new Date().toISOString(),
      export: record,
      case: caseRecord,
      evidence: data.evidence.filter((item) => caseRecord?.evidenceIds.includes(item.id)),
      scope:
        'Evidence manifest with snapshot references and metadata. Snapshot image files are not bundled. This download does not release or transmit evidence.',
    }
    downloadFile(`nova-${id}-manifest.json`, JSON.stringify(manifest, null, 2), 'application/json')
  }
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Evidence management"
        title="Evidence exports"
        subtitle="Review sample evidence packages and download their metadata manifests."
      />
      <div className="exports-grid">
        {evidenceExports.map((item) => (
          <section className="workspace-panel export-card" key={item.id}>
            <div className="export-icon">
              <FileArchive size={24} />
            </div>
            <span className="signal-badge signal-medium">{item.status.replaceAll('-', ' ')}</span>
            <h2>{item.packageType}</h2>
            <p>{item.destination}</p>
            <dl>
              <div>
                <dt>Requested by</dt>
                <dd>{item.requestedBy}</dd>
              </div>
              <div>
                <dt>Requested</dt>
                <dd>{formatShiftDate(item.requestedAt)}</dd>
              </div>
              <div>
                <dt>Package ID</dt>
                <dd>{item.id}</dd>
              </div>
            </dl>
            <Link className="text-link" to={`/cases/${item.caseId}`}>
              Review case
              <ArrowUpRight size={14} />
            </Link>
            <Button variant="outline" disabled={!data} onClick={() => download(item.id)}>
              <ArrowDownToLine size={14} />
              Download manifest
            </Button>
          </section>
        ))}
      </div>
      <div className="notice-panel">
        <FileArchive size={17} />
        <p>
          Manifests include metadata and snapshot references. Downloading a sample manifest does not release
          evidence or notify a recipient.
        </p>
      </div>
    </div>
  )
}
