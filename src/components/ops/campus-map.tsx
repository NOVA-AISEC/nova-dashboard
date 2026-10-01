import { useState } from 'react'
import { Camera, ChevronRight, Layers, Minus, Plus, ScanLine } from 'lucide-react'
import { campusZones } from '@/data/mock-data'
import { isActiveAlert, severityOrder } from '@/lib/operations'
import type { Alert } from '@/types/domain'

const points = [
  { key: 'Perimeter', label: 'North perimeter', x: 265, y: 66 },
  { key: 'Residence', label: 'Residences', x: 154, y: 168 },
  { key: 'Library', label: 'Library', x: 386, y: 164 },
  { key: 'Admin', label: 'Admin block', x: 545, y: 209 },
  { key: 'Lecture', label: 'Lecture blocks', x: 257, y: 290 },
  { key: 'Cafeteria', label: 'Cafeteria', x: 422, y: 320 },
  { key: 'Main Gate', label: 'Main gate', x: 533, y: 386 },
  { key: 'Parking', label: 'Parking A', x: 645, y: 303 },
  { key: 'Service', label: 'Service bay', x: 234, y: 145 },
]

export function CampusMap({ alerts, onReview }: { alerts: Alert[]; onReview: (alert: Alert) => void }) {
  const [selected, setSelected] = useState('Library')
  const [zoom, setZoom] = useState(1)
  const [showCameras, setShowCameras] = useState(false)
  const selectedPoint = points.find((point) => point.key === selected)!
  const zoneAlerts = alerts
    .filter((alert) => alert.zone.includes(selected) && isActiveAlert(alert))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  const camera = campusZones.find((zone) => zone.name.includes(selected))
  return (
    <div className="campus-map">
      <div className="map-topline">
        <span>
          <span className="status-dot" />
          Strathmore campus
        </span>
        <span>Schematic view</span>
      </div>
      <svg viewBox="0 0 760 440" aria-label="Schematic campus overview" className="campus-svg">
        <defs>
          <pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--map-grid)" strokeWidth=".6" />
          </pattern>
          <pattern id="parking-lines" width="14" height="22" patternUnits="userSpaceOnUse">
            <path d="M 0 1 H 11 V 21 H 0" fill="none" stroke="var(--map-line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="760" height="440" fill="url(#map-grid)" />
        <g transform={`translate(${380 * (1 - zoom)} ${220 * (1 - zoom)}) scale(${zoom})`}>
          <path d="M70 45H690V362L570 410H92Z" className="map-boundary" />
          <path
            d="M68 251H690M323 46V358Q323 385 356 385H699M534 251V409"
            fill="none"
            stroke="var(--map-road)"
            strokeWidth="26"
          />
          <path
            d="M68 251H690M323 46V358Q323 385 356 385H699M534 251V409"
            fill="none"
            stroke="var(--map-line)"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <g className="map-green">
            <rect x="86" y="282" width="105" height="74" rx="10" />
            <rect x="442" y="65" width="135" height="67" rx="10" />
            <circle cx="221" cy="201" r="18" />
            <circle cx="603" cy="169" r="25" />
            <circle cx="113" cy="376" r="10" />
            <circle cx="234" cy="78" r="12" />
          </g>
          <g className="map-building">
            <rect x="107" y="112" width="92" height="69" rx="5" />
            <rect x="107" y="190" width="92" height="36" rx="4" />
            <rect x="215" y="120" width="65" height="52" rx="5" />
            <path d="M349 119H441V181H418V212H349Z" />
            <rect x="478" y="154" width="99" height="67" rx="5" />
            <rect x="213" y="289" width="72" height="66" rx="5" />
            <rect x="347" y="285" width="118" height="58" rx="5" />
            <rect x="594" y="280" width="89" height="69" rx="5" />
          </g>
          <rect x="594" y="280" width="89" height="69" fill="url(#parking-lines)" opacity=".6" />
          <g className="map-building-detail">
            <path d="M113 130H192M113 147H192M221 132H274M221 147H274M356 133H433M356 151H433M484 168H569M484 187H569M220 306H277M220 325H277M355 302H456M355 319H456" />
            <path d="M164 119V175M396 125V180M531 160V215M248 295V350M406 290V338" />
          </g>
          <text x="126" y="320" className="map-small-label">
            GREEN SPACE
          </text>
          <text x="472" y="103" className="map-small-label">
            SPORTS GROUNDS
          </text>
          <text x="81" y="237" className="map-road-label">
            CAMPUS DRIVE
          </text>
          <text x="337" y="407" className="map-road-label">
            OLE SANGALE ROAD
          </text>
          {points.map((point) => {
            const incidents = alerts
              .filter((alert) => alert.zone.includes(point.key) && isActiveAlert(alert))
              .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
            const color =
              incidents[0]?.severity === 'critical' ? '#dc5856' : incidents.length ? '#d79645' : '#359679'
            return (
              <g
                key={point.key}
                role="button"
                tabIndex={0}
                aria-label={`Select ${point.label}, ${incidents.length} active incidents`}
                onClick={() => setSelected(point.key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(point.key)
                  }
                }}
                className="map-point"
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected === point.key ? 21 : 15}
                  fill={color}
                  opacity={selected === point.key ? '.16' : '.08'}
                />
                <circle cx={point.x} cy={point.y} r="7" fill={color} stroke="var(--panel)" strokeWidth="3" />
                <text x={point.x} y={point.y + 31} textAnchor="middle" className="map-zone-label">
                  {point.label}
                </text>
                {showCameras && (
                  <text x={point.x} y={point.y + 46} textAnchor="middle" className="map-camera-label">
                    {campusZones.find((zone) => zone.name.includes(point.key))?.cameraId ??
                      'No camera record'}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      <div className="map-controls">
        <button
          aria-label="Zoom in"
          disabled={zoom >= 1.6}
          onClick={() => setZoom((value) => Math.min(1.6, value + 0.2))}
        >
          <Plus size={16} />
        </button>
        <button
          aria-label="Zoom out"
          disabled={zoom <= 1}
          onClick={() => setZoom((value) => Math.max(1, value - 0.2))}
        >
          <Minus size={16} />
        </button>
        <button aria-label="Reset map view" onClick={() => setZoom(1)}>
          <ScanLine size={16} />
        </button>
      </div>
      <button
        className={`map-layers ${showCameras ? 'selected' : ''}`}
        aria-pressed={showCameras}
        onClick={() => setShowCameras((value) => !value)}
      >
        <Layers size={16} />
        Cameras
      </button>
      <div className="map-selection">
        <span
          className={`selection-status ${zoneAlerts.some((alert) => alert.severity === 'critical') ? 'critical' : ''}`}
        />
        <div>
          <strong>{selectedPoint.label}</strong>
          <span>
            <Camera size={12} />
            {camera?.cameraId ?? 'No camera record'} · {zoneAlerts.length} active incident
            {zoneAlerts.length === 1 ? '' : 's'}
          </span>
        </div>
        {!!zoneAlerts.length && (
          <button
            onClick={() => onReview(zoneAlerts[0])}
            aria-label={`Review incident at ${selectedPoint.label}`}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-dot critical" />
          Critical
        </span>
        <span>
          <i className="legend-dot warning" />
          Attention
        </span>
        <span>
          <i className="legend-dot healthy" />
          No active alerts
        </span>
        <span className="map-north">N ↑</span>
      </div>
    </div>
  )
}
