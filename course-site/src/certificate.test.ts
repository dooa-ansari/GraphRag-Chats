import { describe, expect, it } from 'vitest'
import { allChaptersDone, checkUrl, cleanName, fitsPdfFont, isCertificateId, linkedInUrl } from './certificate'
import { chapters } from './content'
import { SITE } from './seo'

describe('certificate helpers', () => {
  it('accepts only IDs in the format the database creates', () => {
    expect(isCertificateId('RA-1A2B3C4D')).toBe(true)
    expect(isCertificateId('ra-1a2b3c4d')).toBe(true)
    expect(isCertificateId('check')).toBe(false)
    expect(isCertificateId('RA-1A2B3C4D5')).toBe(false)
    expect(isCertificateId(undefined)).toBe(false)
  })

  it('tidies names and rejects ones that are too short or too long', () => {
    expect(cleanName('  Ada   Lovelace ')).toBe('Ada Lovelace')
    expect(cleanName(' A ')).toBeNull()
    expect(cleanName('x'.repeat(81))).toBeNull()
  })

  it('only lets through names the PDF font can draw', () => {
    expect(fitsPdfFont('Zoë Müller-Ávila')).toBe(true)
    expect(fitsPdfFont('دعا')).toBe(false)
  })

  it('unlocks only when every chapter is done', () => {
    const slugs = chapters.map((c) => c.slug)
    expect(allChaptersDone(new Set(slugs))).toBe(true)
    expect(allChaptersDone(new Set(slugs.slice(1)))).toBe(false)
  })

  it('fills in LinkedIn\'s add-certification form', () => {
    const url = new URL(linkedInUrl({ id: 'RA-1A2B3C4D', name: 'Ada', issued_at: '2026-10-05T12:00:00Z' }))
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add')
    expect(url.searchParams.get('organizationName')).toBe(SITE.name)
    expect(url.searchParams.get('issueYear')).toBe('2026')
    expect(url.searchParams.get('issueMonth')).toBe('10')
    expect(url.searchParams.get('certId')).toBe('RA-1A2B3C4D')
    expect(url.searchParams.get('certUrl')).toBe(checkUrl('RA-1A2B3C4D'))
  })
})
