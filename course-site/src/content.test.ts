import { describe, expect, it } from 'vitest'
import { chapters, days, parseChapter, parseFrontmatter } from './content'

describe('parseFrontmatter', () => {
  it('reads key/value pairs and returns the rest as body', () => {
    const { data, body } = parseFrontmatter('---\ntitle: RAG, retrieve then answer\nday: 4\n---\n\n## Hi\n')
    expect(data).toEqual({ title: 'RAG, retrieve then answer', day: '4' })
    expect(body.trim()).toBe('## Hi')
  })

  it('treats a file without frontmatter as all body', () => {
    expect(parseFrontmatter('plain text')).toEqual({ data: {}, body: 'plain text' })
  })
})

describe('parseChapter', () => {
  const raw = [
    '---',
    'number: 9',
    'slug: rag',
    'title: RAG',
    'day: 4',
    'minutes: 60',
    'description: Retrieve then answer.',
    '---',
    'Intro text.',
    '',
    '<!-- diagram:rag -->',
    '',
    'More text.',
    '',
    '<!-- answers -->',
    '',
    '1. Retrieval.',
  ].join('\n')

  it('splits text, diagrams and answers', () => {
    const chapter = parseChapter(raw)
    expect(chapter.parts).toEqual([
      { kind: 'markdown', text: 'Intro text.' },
      { kind: 'diagram', name: 'rag' },
      { kind: 'markdown', text: 'More text.' },
    ])
    expect(chapter.answers).toBe('1. Retrieval.')
    expect(chapter.navTitle).toBe('RAG')
  })

  it('names the file when a required field is missing', () => {
    expect(() => parseChapter('---\nslug: x\n---\n', 'broken.md')).toThrow(/broken\.md: missing "number"/)
  })
})

describe('course content', () => {
  it('has all 12 chapters in order with unique slugs', () => {
    expect(chapters.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(new Set(chapters.map((c) => c.slug)).size).toBe(12)
  })

  it('puts every chapter on one of the 5 days', () => {
    const dayNumbers = days.map((d) => d.day)
    for (const c of chapters) expect(dayNumbers).toContain(c.day)
  })

  it('gives every chapter except the capstone answers to its questions', () => {
    const withoutAnswers = chapters.filter((c) => !c.answers).map((c) => c.slug)
    expect(withoutAnswers).toEqual(['capstone'])
  })

  it('only uses diagrams that exist', () => {
    const names = chapters.flatMap((c) => c.parts.filter((p) => p.kind === 'diagram').map((p) => p.name))
    expect(names.sort()).toEqual(['app', 'graphrag', 'rag'])
  })

  it('keeps search descriptions to a length Google shows in full', () => {
    for (const c of chapters) expect(c.description.length, c.slug).toBeLessThanOrEqual(160)
  })
})
