// Chapters are Markdown files in content/chapters, bundled at build time.
// Each file has a small frontmatter block, the chapter body, and optionally
// the check-yourself answers after an `<!-- answers -->` line. A line like
// `<!-- diagram:rag -->` marks where an animated diagram goes.

export type ChapterPart =
  | { kind: 'markdown'; text: string }
  | { kind: 'diagram'; name: string }

export interface Chapter {
  number: number
  slug: string
  title: string
  navTitle: string
  day: number
  minutes: number
  description: string
  parts: ChapterPart[]
  answers: string | null
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const ANSWERS = /^<!--\s*answers\s*-->\s*$/m
const DIAGRAM = /^<!--\s*diagram:([a-z0-9-]+)\s*-->\s*$/m

export function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(FRONTMATTER)
  if (!match) return { data: {}, body: raw }
  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    data[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { data, body: raw.slice(match[0].length) }
}

export function splitParts(body: string): ChapterPart[] {
  const parts: ChapterPart[] = []
  // split() with a capture group alternates text and diagram names.
  const pieces = body.split(new RegExp(DIAGRAM.source, 'm'))
  pieces.forEach((piece, i) => {
    if (i % 2 === 1) parts.push({ kind: 'diagram', name: piece })
    else if (piece.trim()) parts.push({ kind: 'markdown', text: piece.trim() })
  })
  return parts
}

export function parseChapter(raw: string, file = 'chapter'): Chapter {
  const { data, body } = parseFrontmatter(raw)
  for (const key of ['number', 'slug', 'title', 'day', 'minutes', 'description']) {
    if (!data[key]) throw new Error(`${file}: missing "${key}" in frontmatter`)
  }
  const [main, answers] = body.split(ANSWERS)
  return {
    number: Number(data.number),
    slug: data.slug,
    title: data.title,
    navTitle: data.navTitle || data.title,
    day: Number(data.day),
    minutes: Number(data.minutes),
    description: data.description,
    parts: splitParts(main),
    answers: answers?.trim() || null,
  }
}

const files = import.meta.glob('../content/chapters/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const chapters: Chapter[] = Object.entries(files)
  .map(([file, raw]) => parseChapter(raw, file))
  .sort((a, b) => a.number - b.number)

export function getChapter(slug: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.slug === slug)
}

export const days = [
  { day: 1, theme: 'Meet LLMs', hours: '2 h' },
  { day: 2, theme: 'Talk to an LLM in code', hours: '1.5 h' },
  { day: 3, theme: 'Text as numbers', hours: '2 h' },
  { day: 4, theme: 'Retrieval', hours: '2 h' },
  { day: 5, theme: 'GraphRAG', hours: '2.5 h' },
]
