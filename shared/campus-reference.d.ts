export interface CampusSource {
  id: string
  title: string
  url: string
  checkedAt: string
  fact: string
}
export interface CampusPlace {
  id: string
  name: string
  shortName: string
  kind: string
  provenance: 'public-reference' | 'modeled-zone'
  sourceIds: string[]
  description: string
  geometryFeatureIds: string[]
  geometryStatus: 'mapped' | 'unlocated'
  geometryNote: string
  aliases: string[]
  responsibility: string
  baseline: number
}
export const campusSources: CampusSource[]
export const campusPlaces: CampusPlace[]
export function resolveCampusPlace(value: string): CampusPlace | null
