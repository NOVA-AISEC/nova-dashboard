import { useEffect, useRef, useState } from 'react'
import { Crosshair, Minus, Plus } from 'lucide-react'
import type * as Leaflet from 'leaflet'
import { campusPlaces, type CampusPlace } from '../../../shared/campus-reference'
import { campusGeography } from '../../../shared/campus-geography'
import 'leaflet/dist/leaflet.css'

export type CampusLayer = 'security' | 'occupancy' | 'devices'
export type CampusBasemap = 'satellite' | 'streets' | 'footprints'
export type ScenePlace = CampusPlace & {
  status: string
  occupancy: number
  incidentCount: number
}
type MapRuntime = { map: Leaflet.Map; api: typeof Leaflet }
const bounds: Leaflet.LatLngBoundsExpression = [
  [-1.3112251, 36.8118951],
  [-1.3083839, 36.8170902],
]
const tint = (place: ScenePlace, layer: CampusLayer) =>
  place.status === 'stale'
    ? '#bfabfa'
    : layer === 'occupancy'
      ? place.occupancy >= 75
        ? '#ffc083'
        : '#84ddc6'
      : layer === 'devices'
        ? '#9ac3de'
        : place.incidentCount || place.status === 'attention'
          ? '#ffb27b'
          : '#84ddc6'

export function CampusScene({
  places,
  selected,
  layer,
  onSelect,
  basemap = 'satellite',
  sampleMode = 'exercise',
}: {
  places: ScenePlace[]
  selected: string
  layer: CampusLayer
  onSelect: (id: string) => void
  basemap?: CampusBasemap
  sampleMode?: 'exercise' | 'records'
}) {
  const container = useRef<HTMLDivElement>(null)
  const [runtime, setRuntime] = useState<MapRuntime | null>(null)
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const currentPlace = places.find((place) => place.id === selected)
  useEffect(() => {
    let cancelled = false
    let map: Leaflet.Map | undefined
    let observer: ResizeObserver | undefined
    void import('leaflet').then((api) => {
      if (cancelled || !container.current) return
      map = api.map(container.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 15,
        maxZoom: 20,
        scrollWheelZoom: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        zoomSnap: 0.25,
      })
      map.attributionControl.setPrefix(false)
      map.attributionControl.addAttribution(
        '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>',
      )
      map.fitBounds(bounds, { padding: [30, 35] })
      api.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
        observer.observe(container.current)
      }
      setRuntime({ map, api })
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      map?.remove()
    }
  }, [])

  useEffect(() => {
    if (!runtime || basemap === 'footprints') return
    const { api, map } = runtime
    const tiles =
      basemap === 'satellite'
        ? api.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxNativeZoom: 19,
              maxZoom: 20,
              attribution:
                'Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community',
              referrerPolicy: 'no-referrer',
            },
          )
        : api.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxNativeZoom: 19,
            maxZoom: 20,
          })
    tiles.on('loading', () => setTileState('loading'))
    tiles.on('tileerror', () => setTileState('unavailable'))
    tiles.on('load', () => {
      const loaded = container.current?.querySelectorAll('.leaflet-tile-loaded').length ?? 0
      setTileState(loaded ? 'ready' : 'unavailable')
    })
    tiles.addTo(map)
    return () => {
      // Removal must fire before clearing listeners: Leaflet unregisters map events on remove.
      map.removeLayer(tiles)
      tiles.off()
    }
  }, [runtime, basemap])

  useEffect(() => {
    if (!runtime) return
    const { api, map } = runtime
    const overlay = api.layerGroup().addTo(map)
    for (const feature of campusGeography.features) {
      const kind = feature.properties.kind
      const place = places.find((item) => item.geometryFeatureIds.includes(String(feature.id)))
      const color = place ? tint(place, layer) : '#a8b9c8'
      const active = place?.id === selected
      api
        .geoJSON(feature, {
          style:
            kind === 'road'
              ? {
                  color: '#a6b8c8',
                  weight: basemap === 'footprints' ? 5 : 1.5,
                  opacity: basemap === 'footprints' ? 0.55 : 0.25,
                }
              : kind === 'boundary'
                ? {
                    color: active ? color : '#d6e5c4',
                    weight: active ? 3 : 1.6,
                    dashArray: '6 5',
                    fillColor: '#6b9564',
                    fillOpacity: 0.045,
                  }
                : {
                    color: active ? '#ffffff' : color,
                    weight: active ? 3 : 1.5,
                    fillColor: color,
                    fillOpacity: active ? 0.4 : basemap === 'satellite' ? 0.12 : 0.22,
                  },
          pointToLayer: (_feature, point) =>
            api.circleMarker(point, {
              radius: active ? 8 : 5,
              color,
              fillColor: '#15262d',
              fillOpacity: 1,
              weight: 2,
            }),
          onEachFeature: (_feature, shape) => {
            if (place) shape.on('click', () => onSelect(place.id))
            if (kind === 'road') shape.bindTooltip(feature.properties.name, { sticky: true })
          },
        })
        .addTo(overlay)
      if (!place || kind === 'boundary' || kind === 'road') continue
      const point =
        feature.geometry.type === 'Point'
          ? feature.geometry.coordinates
          : feature.properties.labelPoint
      if (!point) continue
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `twin-map-pin ${active ? 'selected' : ''} ${kind} ${feature.properties.name ? '' : 'unnamed'}`
      button.dataset.featureId = String(feature.id)
      button.style.setProperty('--pin-color', color)
      button.setAttribute('aria-label', `Select ${place.name}`)
      button.setAttribute('aria-pressed', String(active))
      const label = document.createElement('span')
      label.textContent = kind === 'parking' ? 'P' : kind === 'gate' ? 'G' : place.shortName
      button.append(label)
      if (kind === 'building' && (active || place.incidentCount)) {
        const count = document.createElement('b')
        count.textContent =
          layer === 'occupancy'
            ? `${place.occupancy}% · SIM`
            : place.incidentCount
              ? `${place.incidentCount} sample incident${place.incidentCount === 1 ? '' : 's'}`
              : 'Selected'
        button.append(count)
      }
      button.addEventListener('click', () => onSelect(place.id))
      api
        .marker([point[1], point[0]], {
          icon: api.divIcon({
            html: button,
            className: 'twin-map-marker',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          keyboard: false,
        })
        .addTo(overlay)
    }
    return () => {
      map.removeLayer(overlay)
    }
  }, [runtime, places, selected, layer, basemap, onSelect])

  useEffect(() => {
    if (!runtime) return
    const place = campusPlaces.find((item) => item.id === selected)
    const feature = campusGeography.features.find((item) =>
      place?.geometryFeatureIds.includes(String(item.id)),
    )
    if (feature?.geometry.type === 'Point')
      runtime.map.panTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
        animate: false,
      })
    else if (feature?.properties.labelPoint && feature.properties.kind !== 'boundary')
      runtime.map.panTo([feature.properties.labelPoint[1], feature.properties.labelPoint[0]], {
        animate: false,
      })
  }, [runtime, selected])

  return (
    <div className={`twin-scene twin-geographic ${basemap}`}>
      <div className="twin-geography-header">
        <span>STRATHMORE / MADARAKA</span>
        <span>WGS84 · NORTH ↑ · EAT</span>
      </div>
      <div
        ref={container}
        className="twin-leaflet-map"
        role="region"
        aria-label="Geographic Strathmore campus map"
      />
      <div className="twin-map-summary">
        <strong>11 mapped buildings</strong>
        <span>Boundary · 6 parking areas · 3 gates</span>
      </div>
      <div className="twin-scene-tools">
        <button aria-label="Zoom campus in" onClick={() => runtime?.map.zoomIn()}>
          <Plus size={15} />
        </button>
        <button aria-label="Zoom campus out" onClick={() => runtime?.map.zoomOut()}>
          <Minus size={15} />
        </button>
        <button
          aria-label="Reset campus view"
          onClick={() => runtime?.map.fitBounds(bounds, { padding: [30, 35] })}
        >
          <Crosshair size={15} />
        </button>
      </div>
      {currentPlace?.geometryStatus === 'unlocated' && (
        <p className="twin-location-pending" role="status">
          <strong>{currentPlace.name}</strong> · location awaiting verification; no guessed map pin.
        </p>
      )}
      {basemap !== 'footprints' && tileState === 'unavailable' && (
        <p className="twin-tile-status" role="status">
          Basemap unavailable. Sourced footprints remain visible; use Footprints view.
        </p>
      )}
      <div className="twin-geography-footer">
        <span>OSM snapshot · 02 OCT 2026 · source dates in place context</span>
        <span>
          {sampleMode === 'exercise' ? 'Telemetry is simulated' : 'Stored sample records'}
        </span>
      </div>
    </div>
  )
}
