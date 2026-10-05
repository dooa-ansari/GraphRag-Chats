import { describe, expect, it } from 'vitest'
import { mergeProgress, nextChapter } from './progress'

describe('mergeProgress', () => {
  it('keeps chapters finished on either side and uploads local-only ones', () => {
    const { merged, toUpload } = mergeProgress(['rag', 'welcome'], ['welcome', 'graphrag'])
    expect(merged).toEqual(['graphrag', 'rag', 'welcome'])
    expect(toUpload).toEqual(['rag'])
  })

  it('uploads nothing when the server already has everything', () => {
    expect(mergeProgress(['rag'], ['rag', 'welcome']).toUpload).toEqual([])
  })

  it('handles duplicates in local storage', () => {
    expect(mergeProgress(['rag', 'rag'], [])).toEqual({ merged: ['rag'], toUpload: ['rag'] })
  })
})

describe('nextChapter', () => {
  const ordered = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]
  it('returns the first unfinished chapter, even after skipping ahead', () => {
    expect(nextChapter(ordered, new Set(['a', 'c']))?.slug).toBe('b')
  })
  it('returns undefined when everything is done', () => {
    expect(nextChapter(ordered, new Set(['a', 'b', 'c']))).toBeUndefined()
  })
})
