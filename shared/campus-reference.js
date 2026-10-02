import { campusGeography } from './campus-geography.js'
// Geographic features retain OSM coordinates; operational assignments remain explicit assumptions.
export const campusSources = [
  {
    id: 'su-contact',
    title: 'Strathmore University · Contact us',
    url: 'https://strathmore.edu/contact-us/',
    checkedAt: '2026-10-02',
    fact: 'The university lists Madaraka Estate, Ole Sangale Road, Nairobi, Kenya as its address.',
  },
  {
    id: 'su-library',
    title: 'Strathmore University Library',
    url: 'https://library.strathmore.edu/',
    checkedAt: '2026-10-02',
    fact: 'Strathmore operates a university library and publishes its library catalog.',
  },
  {
    id: 'su-venues',
    title: 'IEEE IES campus summit · Strathmore University',
    url: 'https://strathmore.edu/news-articles/strathmore-hosts-the-ieee-ies-east-africa-hubs-nodes-industrial-innovation-summit-2026/',
    checkedAt: '2026-10-02',
    fact: 'The university names the Main Auditorium and Microsoft Auditorium as summit venues.',
  },
  {
    id: 'su-msb',
    title: 'The Power of Media · Strathmore University',
    url: 'https://strathmore.edu/news-articles/the-power-of-media-from-campus-to-coverage-o/',
    checkedAt: '2026-10-02',
    fact: 'The university identifies MSB9 as the venue of a March 2026 session.',
  },
  {
    id: 'su-accommodation',
    title: 'Student life · Strathmore University',
    url: 'https://strathmore.edu/student-life/',
    checkedAt: '2026-10-02',
    fact: 'Strathmore states that it does not have accommodation facilities within the university and recommends external hostels.',
  },

  {
    id: 'osm-campus',
    title: 'OpenStreetMap · Strathmore geographic extract',
    url: 'https://www.openstreetmap.org/way/105267819',
    checkedAt: '2026-10-02',
    fact: 'Community-mapped campus boundary, 11 building footprints, 6 parking areas and 3 gate points. Coordinates are retained from OpenStreetMap, with individual feature dates; this is not a campus survey.',
  },
  ...campusGeography.features
    .filter((feature) => !['boundary', 'road'].includes(feature.properties.kind))
    .map((feature) => ({
      id: `osm-${feature.properties.osmType}-${feature.properties.osmId}`,
      title: `OpenStreetMap · ${feature.properties.name || `${feature.properties.kind} ${feature.properties.osmId}`}`,
      url: feature.properties.sourceUrl,
      checkedAt: '2026-10-02',
      fact: `${feature.properties.kind} geometry from OSM ${feature.id}, version ${feature.properties.sourceVersion}, last edited ${feature.properties.sourceUpdatedAt}. ${feature.properties.name ? `Mapped name: ${feature.properties.name}.` : 'No name is supplied by this source.'} No camera, room, capacity or access policy is established by this map.`,
    })),
]

export const campusPlaces = [
  {
    id: 'arrival',
    name: 'Ole Sangale arrival',
    shortName: 'Arrival',
    kind: 'access-zone',
    provenance: 'modeled-zone',
    sourceIds: ['su-contact'],
    description:
      'Public gate points are shown separately. No verified gate assignment for the legacy Main Gate operational zone.',
    geometryFeatureIds: [],
    geometryStatus: 'unlocated',
    geometryNote:
      'Public gate points are shown separately. No verified gate assignment for the legacy Main Gate operational zone.',
    aliases: ['Main Gate  Lane 1', 'Main Gate / Side Gate', 'Main Gate', 'Side Gate'],
    responsibility: 'Gate desk',
    baseline: 38,
  },
  {
    id: 'library',
    name: 'University Library',
    shortName: 'Library',
    kind: 'learning',
    provenance: 'public-reference',
    sourceIds: ['su-library', 'osm-way-105267066'],
    description:
      'Mapped Library building; Library Entrance records resolve to the building, not an exact indoor entrance.',
    geometryFeatureIds: ['way/105267066'],
    geometryStatus: 'mapped',
    geometryNote:
      'Mapped Library building; Library Entrance records resolve to the building, not an exact indoor entrance.',
    aliases: [
      'Library',
      'Library Entrance',
      'Library Entrance / Reading Hall',
      'Library Entrance / Reading Hall A',
    ],
    responsibility: 'Incident desk',
    baseline: 46,
  },
  {
    id: 'main-auditorium',
    name: 'University Auditorium',
    shortName: 'Auditorium',
    kind: 'venue',
    provenance: 'public-reference',
    sourceIds: ['su-venues', 'osm-way-105267044'],
    description:
      'OSM names this footprint Strathmore University Auditorium. The Main Auditorium room alias needs campus confirmation.',
    geometryFeatureIds: ['way/105267044'],
    geometryStatus: 'mapped',
    geometryNote:
      'OSM names this footprint Strathmore University Auditorium. The Main Auditorium room alias needs campus confirmation.',
    aliases: ['Main Auditorium'],
    responsibility: 'Event liaison',
    baseline: 24,
  },
  {
    id: 'microsoft-auditorium',
    name: 'Microsoft Auditorium',
    shortName: 'Microsoft Auditorium',
    kind: 'venue',
    provenance: 'public-reference',
    sourceIds: ['su-venues'],
    description:
      'Documented venue; building and room position unverified. No map pin is fabricated.',
    geometryFeatureIds: [],
    geometryStatus: 'unlocated',
    geometryNote:
      'Documented venue; building and room position unverified. No map pin is fabricated.',
    aliases: ['Microsoft Auditorium'],
    responsibility: 'Event liaison',
    baseline: 20,
  },
  {
    id: 'msb9',
    name: 'MSB9',
    shortName: 'MSB9',
    kind: 'learning',
    provenance: 'public-reference',
    sourceIds: ['su-msb'],
    description: 'Documented teaching room; no verified room-to-footprint mapping.',
    geometryFeatureIds: [],
    geometryStatus: 'unlocated',
    geometryNote: 'Documented teaching room; no verified room-to-footprint mapping.',
    aliases: ['MSB9'],
    responsibility: 'Campus patrol',
    baseline: 32,
  },
  {
    id: 'parking',
    name: 'Mobility & parking zone',
    shortName: 'Parking',
    kind: 'mobility-zone',
    provenance: 'modeled-zone',
    sourceIds: ['su-contact'],
    description:
      'Actual parking polygons have separate entries. Legacy Parking A is not assigned to one arbitrarily.',
    geometryFeatureIds: [],
    geometryStatus: 'unlocated',
    geometryNote:
      'Actual parking polygons have separate entries. Legacy Parking A is not assigned to one arbitrarily.',
    aliases: ['Parking A  East', 'Parking A', 'Parking'],
    responsibility: 'Mobility desk',
    baseline: 41,
  },
  {
    id: 'service',
    name: 'Service access zone',
    shortName: 'Service access',
    kind: 'access-zone',
    provenance: 'modeled-zone',
    sourceIds: ['su-contact'],
    description: 'Service entrance assignment unverified; no event is pinned to a guessed gate.',
    geometryFeatureIds: [],
    geometryStatus: 'unlocated',
    geometryNote: 'Service entrance assignment unverified; no event is pinned to a guessed gate.',
    aliases: ['Service Bay', 'Service Bay / Loading Area'],
    responsibility: 'Campus patrol',
    baseline: 12,
  },
  {
    id: 'perimeter',
    name: 'Campus boundary zone',
    shortName: 'Boundary',
    kind: 'boundary-zone',
    provenance: 'modeled-zone',
    sourceIds: ['su-contact', 'osm-campus'],
    description:
      'Community-mapped campus outline. Perimeter records apply to campus context, not an exact North Fence location.',
    geometryFeatureIds: ['way/105267819'],
    geometryStatus: 'mapped',
    geometryNote:
      'Community-mapped campus outline. Perimeter records apply to campus context, not an exact North Fence location.',
    aliases: ['Perimeter  North Fence', 'Perimeter', 'Perimeter / North Fence'],
    responsibility: 'Campus patrol',
    baseline: 8,
  },

  ...campusGeography.features
    .filter(
      (feature) =>
        !['road', 'boundary'].includes(feature.properties.kind) &&
        ![105267066, 105267044].includes(feature.properties.osmId),
    )
    .map((feature) => ({
      id: `osm-${feature.properties.osmType}-${feature.properties.osmId}`,
      name:
        feature.properties.name.replace('Unviersity', 'University') ||
        `Unnamed ${feature.properties.kind} · ${feature.properties.osmId}`,
      shortName: feature.properties.name
        ? feature.properties.name.replace('Strathmore University ', '').replace('Strathmore ', '')
        : `Unnamed ${feature.properties.kind}`,
      kind: feature.properties.kind,
      provenance: 'public-reference',
      sourceIds: [`osm-${feature.properties.osmType}-${feature.properties.osmId}`],
      description: feature.properties.name
        ? `Publicly mapped ${feature.properties.kind}: ${feature.properties.name}. Source geometry is retained without invented dimensions or elevations.`
        : `Real mapped ${feature.properties.kind}. Its name is not supplied by the source; campus naming needs verification.`,
      geometryFeatureIds: [feature.id],
      geometryStatus: 'mapped',
      geometryNote: `OSM ${feature.id} · version ${feature.properties.sourceVersion} · last edited ${feature.properties.sourceUpdatedAt.slice(0, 10)}. Community mapping, not a current campus survey.`,
      aliases: [],
      responsibility: 'Campus operations',
      baseline: feature.properties.kind === 'building' ? 20 : 8,
    })),
]

const normalize = (value) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : ''
export function resolveCampusPlace(value) {
  const normalized = normalize(value)
  return (
    campusPlaces.find((place) =>
      [place.name, ...place.aliases].some((alias) => normalize(alias) === normalized),
    ) ?? null
  )
}
