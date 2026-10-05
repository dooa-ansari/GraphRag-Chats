import { describe, expect, it } from 'vitest'
import { allPaths, headTags, pageMeta, SITE } from './seo'

describe('pageMeta', () => {
  it('gives each chapter its own title, canonical path and share image', () => {
    const meta = pageMeta('/chapters/rag')
    expect(meta.title).toContain('RAG, retrieve then answer')
    expect(meta.image).toBe(`${SITE.url}/og/rag.png`)
    expect(meta.noindex).toBeFalsy()
  })

  it('marks the course home page up as a free Course', () => {
    const ld = pageMeta('/').jsonLd as Record<string, unknown>
    expect(ld['@type']).toBe('Course')
    expect(ld.isAccessibleForFree).toBe(true)
  })

  it('keeps login and unknown pages out of search results', () => {
    expect(pageMeta('/login').noindex).toBe(true)
    expect(pageMeta('/chapters/nope').noindex).toBe(true)
    expect(pageMeta('/certificate').noindex).toBe(true)
    expect(pageMeta('/certificate/RA-1A2B3C4D').noindex).toBe(true)
  })
})

describe('headTags', () => {
  it('escapes text and cannot be broken out of by JSON-LD content', () => {
    const html = headTags({ path: '/x', title: 'A "quoted" <b>', description: 'd', image: 'i', jsonLd: { name: '</script>' } })
    expect(html).toContain('A &quot;quoted&quot; &lt;b&gt;')
    expect(html).not.toContain('</script><')
    expect(html).toContain('\\u003c/script>')
  })
})

describe('allPaths', () => {
  it('covers the home page, 12 chapters and the extra pages', () => {
    const paths = allPaths()
    expect(paths.filter((p) => p.startsWith('/chapters/'))).toHaveLength(12)
    expect(paths).toEqual(expect.arrayContaining(['/', '/privacy', '/login', '/404']))
  })
})
