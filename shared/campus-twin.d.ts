import type { IntelligenceGraph } from './intelligence-engine'
import type { CampusPlace, CampusSource } from './campus-reference'
import type { campusGeography } from './campus-geography'
export interface TwinRequest {
  scenario?: string
  minute?: number
}
export interface CampusScenario {
  id: string
  name: string
  description: string
  focusPlaceId: string
  startsAt: string
}
export interface TwinReading {
  id: string
  label: string
  value: number | null
  unit: string
  state: 'nominal' | 'attention' | 'stale'
  sampledAt: string
  provenance: 'simulation'
  connector: string
  connected: false
}
export interface TwinPlace extends CampusPlace {
  status: 'nominal' | 'attention' | 'stale'
  readings: TwinReading[]
  recordIds: string[]
  activeIncidentIds: string[]
  queue: number
}
export interface CampusTwin {
  version: number
  campus: {
    name: string
    locality: string
    address: string
    timezone: string
    geometry: 'openstreetmap'
    geometryVerified: false
    geographicSource: string
    geographicSnapshot: string
  }
  generatedAt: string
  replay: {
    scenario: string
    minute: number
    at: string
    exercise: CampusScenario
  }
  scenarios: CampusScenario[]
  places: TwinPlace[]
  geography: typeof campusGeography
  sources: CampusSource[]
  events: {
    minute: number
    title: string
    detail: string
    at: string
    placeId: string
    provenance: 'simulation'
  }[]
  recommendations: { title: string; detail: string; basisIds: string[] }[]
  unmapped: { id: string; title: string; location: string }[]
  engine: {
    provider: 'local-rules'
    vision: string
    connected: false
    mode: 'exercise'
  }
  notice: string
  limitations: string[]
}
export const campusScenarios: CampusScenario[]
export function validateTwinRequest(payload?: TwinRequest): {
  scenario: string
  minute: number
}
export function buildCampusTwin(graph: IntelligenceGraph, payload?: TwinRequest): CampusTwin
