import type { SearchResults } from '../src/types/domain'
import type { SecurityState } from './security-engine'
export type EntityKind =
  'incident' | 'evidence' | 'case' | 'camera' | 'location' | 'team' | 'assessment' | 'mission'
export type QueryMode = 'connections' | 'evidence' | 'gaps' | 'timeline' | 'response'
export interface IntelligenceEntity {
  id: string
  kind: EntityKind
  recordId: string
  title: string
  detail: string
  properties: Record<string, string>
  recordedAt: string
  provenance: 'stored-record'
}
export interface IntelligenceEdge {
  id: string
  source: string
  target: string
  relation: string
  basis: string
  sourceIds: string[]
}
export interface IntelligenceGap {
  id: string
  title: string
  detail: string
  sourceIds: string[]
}
export interface IntelligenceEvent {
  id: string
  title: string
  detail: string
  at: string
  sourceIds: string[]
}
export interface IntelligenceGraph {
  nodes: IntelligenceEntity[]
  edges: IntelligenceEdge[]
  gaps: IntelligenceGap[]
  timeline: IntelligenceEvent[]
  omitted: number
  generatedAt: string
  engine: {
    provider: 'local-rules'
    model: string
    inferenceConnected: false
    label: string
    detail: string
  }
}
export interface IntelligenceQuery {
  question: string
  nodeId?: string
  mode?: QueryMode
}
export interface IntelligenceAnswer {
  question: string
  mode: QueryMode
  anchorId: string
  provider: 'local-rules'
  generatedAt: string
  status: 'answered' | 'no-match' | 'unsupported'
  summary: string
  claims: { text: string; sourceIds: string[] }[]
  sourceIds: string[]
}
export const entityKinds: EntityKind[]
export const intelligenceModes: QueryMode[]
export function buildIntelligence(
  records: SearchResults,
  security: SecurityState,
  user: { email: string; role: string },
): IntelligenceGraph
export function neighborhood(
  graph: IntelligenceGraph,
  nodeId: string,
  depth?: number,
): Pick<IntelligenceGraph, 'nodes' | 'edges'>
export function queryIntelligence(
  graph: IntelligenceGraph,
  query: IntelligenceQuery,
): IntelligenceAnswer
