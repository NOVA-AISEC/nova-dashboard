import { useState } from 'react'
import { Crosshair, Minus, Plus } from 'lucide-react'
import {
  neighborhood,
  type IntelligenceGraph,
  type IntelligenceEntity,
} from '../../../shared/intelligence-engine'

const colors: Record<string, string> = {
  incident: '#f17b58',
  evidence: '#58b5d2',
  case: '#b4a0e6',
  camera: '#75a9c8',
  location: '#80b9a9',
  team: '#d3b77b',
  assessment: '#89a5f4',
  mission: '#b4c37b',
}
export function EntityGraph({
  graph,
  selected,
  depth,
  onSelect,
}: {
  graph: IntelligenceGraph
  selected: IntelligenceEntity
  depth: number
  onSelect: (id: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const context = neighborhood(graph, selected.id, depth)
  const priority = {
    incident: 0,
    evidence: 1,
    case: 2,
    assessment: 3,
    mission: 4,
    camera: 5,
    location: 6,
    team: 7,
  }
  const peripheral = context.nodes
    .filter((node) => node.id !== selected.id)
    .sort((a, b) => priority[a.kind] - priority[b.kind] || a.id.localeCompare(b.id))
    .slice(0, 20)
  const positions = new Map([[selected.id, { x: 450, y: 270 }]])
  peripheral.forEach((node, index) => {
    const innerCount = Math.min(peripheral.length, 8)
    const outer = index >= 8
    const count = outer ? peripheral.length - 8 : innerCount
    const angle = ((index - (outer ? 8 : 0)) * Math.PI * 2) / count - Math.PI / 2
    positions.set(node.id, {
      x: 450 + Math.cos(angle) * (outer ? 345 : 225),
      y: 270 + Math.sin(angle) * (outer ? 205 : 155),
    })
  })
  const nodes = [selected, ...peripheral]
  return (
    <div className="intel-graph">
      <div className="intel-graph-meta">
        <span>RELATIONSHIP EXPLORER</span>
        <span>
          {context.nodes.length} entities · {context.edges.length} links
        </span>
      </div>
      <svg viewBox="0 0 900 540" role="group" aria-label="Connected entity graph">
        <defs>
          <pattern id="intel-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".8" fill="#34414e" />
          </pattern>
        </defs>
        <rect width="900" height="540" fill="url(#intel-grid)" />
        <g transform={`translate(${450 * (1 - zoom)} ${270 * (1 - zoom)}) scale(${zoom})`}>
          {context.edges.map((edge) => {
            const source = positions.get(edge.source),
              target = positions.get(edge.target)
            if (!source || !target) return null
            const focused = edge.source === selected.id || edge.target === selected.id
            return (
              <g key={edge.id} className={focused ? 'intel-edge focused' : 'intel-edge'}>
                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y}>
                  <title>
                    {edge.relation}: {edge.basis}
                  </title>
                </line>
                {focused && peripheral.length <= 8 && (
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 6}
                    textAnchor="middle"
                  >
                    {edge.relation}
                  </text>
                )}
              </g>
            )
          })}
          {nodes.map((node) => {
            const point = positions.get(node.id)!,
              focus = node.id === selected.id
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`Explore ${node.kind}: ${node.title}`}
                aria-pressed={focus}
                className={`intel-node ${focus ? 'selected' : ''}`}
                transform={`translate(${point.x} ${point.y})`}
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(node.id)
                  }
                }}
              >
                <title>
                  {node.title} · {node.recordId}
                </title>
                {focus && (
                  <circle r="35" fill="none" stroke={colors[node.kind]} strokeOpacity=".25" />
                )}
                <circle
                  r={focus ? 25 : 17}
                  fill="#14202a"
                  stroke={colors[node.kind]}
                  strokeWidth={focus ? 2 : 1.4}
                />
                <text
                  y="4"
                  textAnchor="middle"
                  className="intel-node-symbol"
                  fill={colors[node.kind]}
                >
                  {node.kind === 'incident'
                    ? '!'
                    : node.kind === 'evidence'
                      ? '▣'
                      : node.kind.slice(0, 1).toUpperCase()}
                </text>
                <text y={focus ? 51 : 39} textAnchor="middle" className="intel-node-title">
                  {node.title.length > 29 ? `${node.title.slice(0, 27)}…` : node.title}
                </text>
                <text y={focus ? 67 : 54} textAnchor="middle" className="intel-node-kind">
                  {node.kind.toUpperCase()}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="intel-graph-bottom">
        <span>Exact record links · co-location does not imply causation</span>
        <div>
          <button
            aria-label="Zoom out graph"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}
          >
            <Minus size={15} />
          </button>
          <button aria-label="Reset graph zoom" onClick={() => setZoom(1)}>
            <Crosshair size={15} />
          </button>
          <button
            aria-label="Zoom in graph"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.15))}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      {context.nodes.length > 21 && (
        <p className="intel-graph-limit">
          Showing 21 of {context.nodes.length} entities. Use the entity list to explore more.
        </p>
      )}
    </div>
  )
}
