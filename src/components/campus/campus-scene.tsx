import { useId, useState } from 'react'
import { Crosshair, Minus, Plus } from 'lucide-react'
import type { CampusPlace } from '../../../shared/campus-reference'

export type CampusLayer = 'security' | 'occupancy' | 'devices'
export type ScenePlace = CampusPlace & {
  status: string
  occupancy: number
  incidentCount: number
}
const tint = (place: ScenePlace, layer: CampusLayer) =>
  layer === 'occupancy'
    ? place.occupancy >= 75
      ? '#f0b56e'
      : '#71c9b0'
    : layer === 'devices'
      ? place.status === 'stale'
        ? '#af9ae5'
        : '#7296ac'
      : place.status === 'stale'
        ? '#af9ae5'
        : place.incidentCount || place.status === 'attention'
          ? '#f0a574'
          : '#70bca9'

export function CampusScene({
  places,
  selected,
  layer,
  onSelect,
  flat = false,
  sampleMode = 'exercise',
}: {
  places: ScenePlace[]
  selected: string
  layer: CampusLayer
  onSelect: (id: string) => void
  flat?: boolean
  sampleMode?: 'exercise' | 'records'
}) {
  const [zoom, setZoom] = useState(1)
  const unique = useId().replaceAll(':', '')
  return (
    <div className={`twin-scene ${flat ? 'flat' : ''}`}>
      <div className="twin-scene-label">
        <span>MADARAKA / CAMPUS MODEL</span>
        <span>Conceptual geometry · EAT</span>
      </div>
      <svg viewBox="0 0 960 590" role="group" aria-label="Conceptual Strathmore campus model">
        <defs>
          <pattern id={`twin-grid-${unique}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#31424a" strokeWidth=".65" />
          </pattern>
          <pattern id={`twin-roof-${unique}`} width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M15 0H0V15" fill="none" stroke="#b6d2d5" strokeWidth=".6" opacity=".22" />
          </pattern>
        </defs>
        <rect width="960" height="590" fill={`url(#twin-grid-${unique})`} opacity=".55" />
        <g transform={`translate(${480 * (1 - zoom)} ${295 * (1 - zoom)}) scale(${zoom})`}>
          <path
            d="M67 72H879V489H67Z"
            fill="#1f3035"
            stroke="#526c72"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <path
            d="M100 290H850M323 90V456M80 474H881M686 300V452"
            stroke="#2d4349"
            strokeWidth="28"
            fill="none"
          />
          <path
            d="M100 290H850M323 90V456M80 474H881"
            stroke="#68828a"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4 8"
            opacity=".45"
          />
          <g fill="#264a40" stroke="#3f6b59" strokeWidth="1">
            <rect x="92" y="330" width="94" height="63" rx="12" />
            <rect x="456" y="70" width="120" height="57" rx="12" />
            <rect x="531" y="315" width="86" height="33" rx="12" />
            {[115, 145, 810, 839].map((x, i) => (
              <circle key={x} cx={x} cy={i < 2 ? 108 : 95} r="12" />
            ))}
          </g>
          {places.map((place, index) => {
            const { x, y, width, depth } = place
            const lift = flat ? 0 : place.height
            const skew = flat ? 0 : 20
            const color = tint(place, layer)
            const active = selected === place.id
            return (
              <g
                key={place.id}
                className={`twin-building ${active ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Select ${place.name}`}
                aria-pressed={active}
                onClick={() => onSelect(place.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(place.id)
                  }
                }}
              >
                {active && (
                  <rect
                    x={x - width / 2 - 11}
                    y={y - depth / 2 - lift - 11}
                    width={width + skew + 22}
                    height={depth + lift + 22}
                    rx="6"
                    fill={color}
                    opacity=".07"
                    stroke={color}
                    strokeWidth="1.5"
                  />
                )}
                <path
                  d={`M${x - width / 2} ${y + depth / 2 - lift}L${x + width / 2} ${y + depth / 2 - lift}L${x + width / 2} ${y + depth / 2}L${x - width / 2} ${y + depth / 2}Z`}
                  fill="#2b464e"
                  stroke={color}
                  strokeOpacity=".65"
                />
                <path
                  d={`M${x + width / 2} ${y + depth / 2 - lift}L${x + width / 2 + skew} ${y - depth / 2 - lift}V${y - depth / 2}L${x + width / 2} ${y + depth / 2}Z`}
                  fill="#243b43"
                  stroke={color}
                  strokeOpacity=".45"
                />
                <path
                  d={`M${x - width / 2} ${y - depth / 2 - lift}H${x + width / 2 + skew}L${x + width / 2} ${y + depth / 2 - lift}H${x - width / 2}Z`}
                  fill={active ? '#466571' : '#354e59'}
                  stroke={color}
                  strokeWidth={active ? 2 : 1}
                />
                <path
                  d={`M${x - width / 2} ${y - depth / 2 - lift}H${x + width / 2 + skew}L${x + width / 2} ${y + depth / 2 - lift}H${x - width / 2}Z`}
                  fill={`url(#twin-roof-${unique})`}
                />
                {!flat &&
                  place.height > 30 &&
                  [1, 2, 3].map((floor) => (
                    <path
                      key={floor}
                      d={`M${x - width / 2 + 7} ${y + depth / 2 - lift + floor * 12}H${x + width / 2 - 7}`}
                      stroke="#8db9c4"
                      strokeWidth="3"
                      strokeDasharray="7 6"
                      opacity=".35"
                    />
                  ))}
                <circle
                  cx={x}
                  cy={y - lift - 8}
                  r="12"
                  fill="#17292e"
                  stroke={color}
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={y - lift - 4}
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="700"
                >
                  {layer === 'occupancy'
                    ? place.occupancy
                    : layer === 'security' && place.incidentCount
                      ? place.incidentCount
                      : String(index + 1).padStart(2, '0')}
                </text>
                <text
                  x={x + 4}
                  y={y + depth / 2 + 20}
                  textAnchor="middle"
                  fill={active ? '#eff7f7' : '#aac2c8'}
                  fontSize="12"
                  fontWeight={active ? '700' : '500'}
                >
                  {place.shortName}
                </text>
                <text
                  x={x + 4}
                  y={y + depth / 2 + 36}
                  textAnchor="middle"
                  fill="#688f9c"
                  fontSize="8.5"
                  letterSpacing="1"
                >
                  {place.provenance === 'public-reference'
                    ? 'PUBLIC PLACE / MODELED FOOTPRINT'
                    : 'PROPOSED ZONE'}
                </text>
              </g>
            )
          })}
          <text x="480" y="520" textAnchor="middle" fill="#7697a1" fontSize="12" letterSpacing="3">
            OLE SANGALE ROAD / CAMPUS CONTEXT
          </text>
          <text x="480" y="544" textAnchor="middle" fill="#526f79" fontSize="10">
            Positions, distances and connections are illustrative
          </text>
        </g>
      </svg>
      <div className="twin-scene-tools">
        <button
          aria-label="Zoom campus in"
          disabled={zoom >= 1.4}
          onClick={() => setZoom(Math.min(1.4, zoom + 0.2))}
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Zoom campus out"
          disabled={zoom <= 0.8}
          onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}
        >
          <Minus size={15} />
        </button>
        <button aria-label="Reset campus view" onClick={() => setZoom(1)}>
          <Crosshair size={15} />
        </button>
      </div>
      <div className="twin-scene-key">
        <span>
          <i />
          {sampleMode === 'exercise' ? 'Sample nominal' : 'No mapped open record'}
        </span>
        <span>
          <i />
          {sampleMode === 'exercise' ? 'Sample attention' : 'Open sample incident'}
        </span>
        <span>
          <i />
          Sample stale
        </span>
      </div>
    </div>
  )
}
