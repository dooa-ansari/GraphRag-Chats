import { useCallback, useEffect, useRef, useState } from 'react'

interface Step {
  title: string
  sub: string
}

const DIAGRAMS: Record<string, { caption: string; steps: Step[] }> = {
  app: {
    caption: 'What GraphRAG Chats does with every question',
    steps: [
      { title: 'Question', sub: 'turned into numbers' },
      { title: 'Match', sub: 'closest nodes by meaning' },
      { title: 'Follow arrows', sub: 'collect related facts' },
      { title: 'Answer', sub: 'LLM writes from facts' },
    ],
  },
  rag: {
    caption: 'How one question flows through RAG',
    steps: [
      { title: 'Question', sub: '"Can I send it back?"' },
      { title: 'Retrieve', sub: 'find matching facts' },
      { title: 'Augment', sub: 'facts + question in prompt' },
      { title: 'Generate', sub: 'LLM writes the answer' },
    ],
  },
  graphrag: {
    caption: 'GraphRAG: RAG plus a walk along the links',
    steps: [
      { title: 'Embed', sub: 'question to numbers' },
      { title: 'Match', sub: 'vector search finds nodes' },
      { title: 'Traverse', sub: 'follow relationships' },
      { title: 'Prompt', sub: 'nodes + links as text' },
      { title: 'Answer', sub: 'from those facts only' },
    ],
  },
}

/** Steps that light up one after another, with a pulse along each link. */
export function FlowDiagram({ name }: { name: string }) {
  const diagram = DIAGRAMS[name]
  const [lit, setLit] = useState(-1)
  const timers = useRef<number[]>([])

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout)
    const count = diagram?.steps.length ?? 0
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLit(count - 1)
      return
    }
    setLit(-1)
    timers.current = Array.from({ length: count }, (_, i) => window.setTimeout(() => setLit(i), 350 + i * 800))
  }, [diagram])

  useEffect(() => {
    play()
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [play])

  if (!diagram) return null
  return (
    <figure className="figure">
      <div className="figure-head">
        <strong>{diagram.caption}</strong>
        <button type="button" className="ghost" onClick={play}>
          Replay
        </button>
      </div>
      <ol className="flow" style={{ ['--steps' as string]: diagram.steps.length }}>
        {diagram.steps.map((step, i) => (
          <li key={step.title} className={i <= lit ? 'step lit' : 'step'}>
            {i > 0 && <span className={i <= lit ? 'link lit' : 'link'} aria-hidden="true" />}
            <span className="step-box">
              <b>{step.title}</b>
              <small>{step.sub}</small>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  )
}
