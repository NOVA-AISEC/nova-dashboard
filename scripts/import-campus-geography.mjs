import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Import a reviewed public OSM extract, never operational or personal location data.
const input = process.argv[2]
if (!input) throw new Error('Usage: node scripts/import-campus-geography.mjs <osm-map.json>')
const extract = JSON.parse(await readFile(input, 'utf8'))
const nodes = new Map(
  extract.elements.filter((item) => item.type === 'node').map((item) => [item.id, item]),
)
const ways = extract.elements.filter((item) => item.type === 'way')
const coordinates = (way) =>
  way.nodes.map((id) => {
    const node = nodes.get(id)
    if (!node) throw new Error(`Missing node ${id}`)
    return [node.lon, node.lat]
  })
const boundary = ways.find((item) => item.id === 105267819)
if (!boundary) throw new Error('Missing Strathmore campus boundary')
const ring = coordinates(boundary)
function inside([x, y]) {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) result = !result
  }
  return result
}
const center = (points) => {
  const open = points.slice(0, -1)
  return [0, 1].map((axis) =>
    Number((open.reduce((sum, point) => sum + point[axis], 0) / open.length).toFixed(7)),
  )
}
const feature = (item, kind) => {
  const points = item.type === 'node' ? [item.lon, item.lat] : coordinates(item)
  const polygon = kind !== 'road' && item.type === 'way'
  return {
    type: 'Feature',
    id: `${item.type}/${item.id}`,
    properties: {
      kind,
      name: item.tags?.name ?? '',
      osmId: item.id,
      osmType: item.type,
      sourceUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      sourceUpdatedAt: item.timestamp,
      sourceVersion: item.version,
      ...(kind === 'road' ? { roadClass: item.tags.highway } : {}),
      ...(polygon ? { labelPoint: center(points) } : {}),
    },
    geometry: {
      type: item.type === 'node' ? 'Point' : polygon ? 'Polygon' : 'LineString',
      coordinates: polygon ? [points] : points,
    },
  }
}
const features = [feature(boundary, 'boundary')]
for (const way of ways) {
  if (!way.tags) continue
  if (way.tags.building && inside(center(coordinates(way)))) features.push(feature(way, 'building'))
  else if (way.tags.amenity === 'parking' && inside(center(coordinates(way))))
    features.push(feature(way, 'parking'))
  else if (
    way.tags.highway &&
    ['Ole Sangale Road', 'Ole Sangale Link Road', 'Keri Road', 'Langata Road'].includes(
      way.tags.name,
    )
  )
    features.push(feature(way, 'road'))
}
for (const id of [1213090144, 1213096194, 9266722482]) {
  const node = nodes.get(id)
  if (!node || node.tags?.barrier !== 'gate') throw new Error(`Missing reviewed gate ${id}`)
  features.push(feature(node, 'gate'))
}
const geography = {
  type: 'FeatureCollection',
  metadata: {
    campus: 'Strathmore University · Madaraka',
    crs: 'EPSG:4326',
    retrievedAt: '2026-10-02',
    bbox: [36.8115, -1.3116, 36.8175, -1.3079],
    sourceUrl:
      'https://www.openstreetmap.org/api/0.6/map.json?bbox=36.8115,-1.3116,36.8175,-1.3079',
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL 1.0',
    licenseUrl: 'https://www.openstreetmap.org/copyright',
    note: 'Community-mapped geometry; retained without reshaping. Not a current campus survey. Source dates are per feature. Indoor venues and unverified operational zones have no invented coordinates.',
  },
  features,
}
const output = fileURLToPath(new URL('../shared/campus-geography.js', import.meta.url))
await writeFile(
  output,
  `// Public geographic data © OpenStreetMap contributors, ODbL 1.0.\n// Reproduce with scripts/import-campus-geography.mjs; attribution travels with this dataset.\nexport const campusGeography = ${JSON.stringify(geography, null, 2)}\n`,
)
console.log(
  `Imported ${features.filter((item) => item.properties.kind === 'building').length} building footprints, ${features.filter((item) => item.properties.kind === 'parking').length} parking areas, boundary, roads and 3 mapped gates.`,
)
