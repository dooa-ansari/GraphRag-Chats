import { checkUrl, formatDate, type Certificate } from './certificate'
import { SITE } from './seo'

const INK = '#0f172a'
const MUTED = '#5b6780'
const BLUE = '#2563eb'
const SOFT = '#dbeafe'
const GREEN = '#16a34a'

/** Draws the certificate as a landscape A4 PDF and downloads it. jsPDF is loaded on first use. */
export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210
  const cx = W / 2

  doc.setProperties({ title: `${SITE.course}: Certificate of Completion`, author: SITE.name, subject: cert.name })

  // Frame
  doc.setFillColor('#f7f9fc')
  doc.rect(0, 0, W, H, 'F')
  doc.setDrawColor(BLUE)
  doc.setLineWidth(1.2)
  doc.roundedRect(10, 10, W - 20, H - 20, 4, 4, 'S')
  doc.setDrawColor(SOFT)
  doc.setLineWidth(0.5)
  doc.roundedRect(14, 14, W - 28, H - 28, 3, 3, 'S')

  // Brand: Nodey and the name
  drawNodey(doc, 24, 22, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(INK)
  doc.text(SITE.name, 42, 31)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  doc.text(SITE.url.replace(/^https?:\/\//, ''), W - 24, 31, { align: 'right' })

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(BLUE)
  // jsPDF's centering ignores letter spacing, so measure the spaced width ourselves.
  const heading = 'CERTIFICATE OF COMPLETION'
  const spacing = 1.5
  const headingWidth = doc.getTextWidth(heading) + spacing * (heading.length - 1)
  doc.setCharSpace(spacing)
  doc.text(heading, cx - headingWidth / 2, 62)
  doc.setCharSpace(0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(MUTED)
  doc.text('This is to confirm that', cx, 78, { align: 'center' })

  // Name, shrunk to fit long names
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK)
  let size = 38
  doc.setFontSize(size)
  while (doc.getTextWidth(cert.name) > W - 70 && size > 18) doc.setFontSize(--size)
  doc.text(cert.name, cx, 98, { align: 'center' })
  doc.setDrawColor(BLUE)
  doc.setLineWidth(0.6)
  doc.line(cx - 60, 104, cx + 60, 104)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(MUTED)
  doc.text('completed all 12 chapters of the free online course', cx, 118, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(INK)
  doc.text(SITE.course, cx, 132, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(MUTED)
  doc.text(
    'LLMs, OpenRouter, embeddings, vector search, RAG, knowledge graphs and GraphRAG · about 10 hours',
    cx,
    141,
    { align: 'center' },
  )

  // Details
  const rows: [string, string][] = [
    ['Issued', formatDate(cert.issued_at)],
    ['Certificate ID', cert.id],
    ['Check it at', checkUrl(cert.id).replace(/^https?:\/\//, '')],
  ]
  const colW = (W - 60) / rows.length
  rows.forEach(([label, value], i) => {
    const x = 30 + colW * i + colW / 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    doc.text(label.toUpperCase(), x, 162, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(INK)
    doc.text(value, x, 169, { align: 'center' })
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(
    'Chapters are marked complete by the learner. This certificate confirms course completion; it is not an accredited qualification.',
    cx,
    186,
    { align: 'center' },
  )

  doc.save(`rehbar-ai-certificate-${cert.id}.pdf`)
}

/** The mascot from the site logo, drawn with shapes. */
function drawNodey(doc: import('jspdf').jsPDF, x: number, y: number, size: number) {
  const s = size / 40
  doc.setDrawColor(BLUE)
  doc.setLineWidth(2 * s)
  doc.line(x + 20 * s, y + 8 * s, x + 20 * s, y + 3 * s)
  doc.setFillColor(GREEN)
  doc.circle(x + 20 * s, y + 3 * s, 2 * s, 'F')
  doc.setFillColor(BLUE)
  doc.roundedRect(x + 6 * s, y + 8 * s, 28 * s, 26 * s, 7 * s, 7 * s, 'F')
  doc.setFillColor('#070b14')
  doc.roundedRect(x + 10 * s, y + 13 * s, 20 * s, 12 * s, 4 * s, 4 * s, 'F')
  doc.setFillColor('#60a5fa')
  doc.circle(x + 16 * s, y + 19 * s, 2.4 * s, 'F')
  doc.circle(x + 24 * s, y + 19 * s, 2.4 * s, 'F')
}
