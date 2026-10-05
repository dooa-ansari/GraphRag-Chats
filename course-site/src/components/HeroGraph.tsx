import { useEffect, useState } from 'react'

// A tiny family-tree graph that replays the GraphRAG walk from Chapter 11:
// match "Emily", then follow her links to find her grandfather.
const NODES = [
  { id: 'emily', label: 'Emily', x: 200, y: 200 },
  { id: 'james', label: 'James', x: 90, y: 110 },
  { id: 'linda', label: 'Linda', x: 310, y: 110 },
  { id: 'robert', label: 'Robert', x: 90, y: 30 },
  { id: 'paint', label: 'Painting', x: 320, y: 270 },
]
const EDGES = [
  { from: 'james', to: 'emily', label: 'Father' },
  { from: 'linda', to: 'emily', label: 'Mother' },
  { from: 'robert', to: 'james', label: 'Father' },
  { from: 'emily', to: 'paint', label: 'Loves' },
]
// Each phase lights more of the graph.
const PHASES = [[], ['emily'], ['emily', 'james', 'linda', 'paint'], ['emily', 'james', 'linda', 'paint', 'robert']]

export function HeroGraph() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(PHASES.length - 1)
      return
    }
    const id = window.setInterval(() => setPhase((p) => (p + 1) % (PHASES.length + 1)), 1300)
    return () => clearInterval(id)
  }, [])
  const lit = new Set(PHASES[Math.min(phase, PHASES.length - 1)])
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n]))

  return (
    <figure className="hero-graph" aria-label="Animated example: GraphRAG finds Emily, then follows her links to her grandfather Robert">
      <svg viewBox="0 0 400 310" role="img">
        {EDGES.map((e) => {
          const a = pos[e.from]
          const b = pos[e.to]
          const on = lit.has(e.from) && lit.has(e.to)
          return (
            <g key={`${e.from}-${e.to}`} className={on ? 'g-edge on' : 'g-edge'}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} textAnchor="middle">
                {e.label}
              </text>
            </g>
          )
        })}
        {NODES.map((n) => {
          const state = n.id === 'emily' && lit.has(n.id) ? 'match' : lit.has(n.id) ? 'walk' : ''
          return (
            <g key={n.id} className={`g-node ${state}`} transform={`translate(${n.x} ${n.y})`}>
              <circle r="26" />
              <text textAnchor="middle" dy="4">
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption>
        <span className="key match">matched</span>
        <span className="key walk">followed a link</span>
        <span className="q">"Who is Emily's grandfather?" → Robert</span>
      </figcaption>
    </figure>
  )
}
