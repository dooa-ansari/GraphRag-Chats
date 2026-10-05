import { chapters } from './content'
import { SITE } from './seo'

export interface Certificate {
  id: string
  name: string
  issued_at: string
}

export const TABLE = 'certificates'

/** IDs look like RA-1A2B3C4D (see supabase/certificates.sql). */
export const isCertificateId = (id: string | undefined): id is string => /^RA-[0-9A-F]{8}$/i.test(id ?? '')

/** Trims and collapses spaces; null when the name is too short or too long. */
export function cleanName(name: string): string | null {
  const clean = name.trim().replace(/\s+/g, ' ')
  return clean.length >= 2 && clean.length <= 80 ? clean : null
}

/** The PDF uses a built-in font, so names must stay within Latin letters and accents. */
export const fitsPdfFont = (name: string) => /^[\u0020-\u007e\u00a0-\u00ff]*$/.test(name)

export const allChaptersDone = (done: Set<string>) => chapters.every((c) => done.has(c.slug))

export const checkUrl = (id: string) => `${SITE.url}/certificate/${id}`

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** LinkedIn's "Add licence or certification" form, filled in. */
export function linkedInUrl(cert: Certificate): string {
  const issued = new Date(cert.issued_at)
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${SITE.course} (Certificate of Completion)`,
    organizationName: SITE.name,
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: checkUrl(cert.id),
    certId: cert.id,
  })
  return `https://www.linkedin.com/profile/add?${params}`
}
