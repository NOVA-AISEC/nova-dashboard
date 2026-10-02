import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, ShieldCheck } from 'lucide-react'
import { CampusScene } from '@/components/campus/campus-scene'
import { isActiveAlert, severityOrder } from '@/lib/operations'
import { campusPlaces, resolveCampusPlace } from '../../../shared/campus-reference'
import type { Alert } from '@/types/domain'

export function CampusMap({
  alerts,
  onReview,
}: {
  alerts: Alert[]
  onReview: (alert: Alert) => void
}) {
  const [selected, setSelected] = useState('library')
  const active = alerts.filter(isActiveAlert)
  const places = campusPlaces.map((place) => {
    const linked = active.filter((alert) => resolveCampusPlace(alert.zone)?.id === place.id)
    return {
      ...place,
      status: linked.length ? 'attention' : 'nominal',
      occupancy: 0,
      incidentCount: linked.length,
    }
  })
  const incident = active
    .filter((alert) => resolveCampusPlace(alert.zone)?.id === selected)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])[0]
  return (
    <div className="campus-map">
      <CampusScene
        places={places}
        selected={selected}
        layer="security"
        onSelect={setSelected}
        sampleMode="records"
      />
      <div className="campus-map-grounding">
        <ShieldCheck size={14} />
        <span>OSM campus footprints · stored sample records</span>
        <Link to={`/campus?place=${selected}`}>
          Open twin
          <ArrowUpRight size={13} />
        </Link>
      </div>
      {incident && (
        <button className="campus-map-review" onClick={() => onReview(incident)}>
          <span>Review {incident.title}</span>
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}
