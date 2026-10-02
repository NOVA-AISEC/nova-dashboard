import type { FeatureCollection, Geometry } from 'geojson'
export interface CampusFeatureProperties {
  kind: 'boundary' | 'building' | 'parking' | 'road' | 'gate'
  name: string
  osmId: number
  osmType: 'way' | 'node'
  sourceUrl: string
  sourceUpdatedAt: string
  sourceVersion: number
  labelPoint?: [number, number]
  roadClass?: string
}
export const campusGeography: FeatureCollection<Geometry, CampusFeatureProperties> & {
  metadata: {
    campus: string
    crs: 'EPSG:4326'
    retrievedAt: string
    bbox: [number, number, number, number]
    sourceUrl: string
    attribution: string
    license: string
    licenseUrl: string
    note: string
  }
}
