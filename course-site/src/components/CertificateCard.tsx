import { formatDate, type Certificate } from '../certificate'
import { SITE } from '../seo'
import { Nodey } from './Nodey'

/** On-screen version of the certificate (the PDF is drawn in certificatePdf.ts). */
export function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <div className="cert-card">
      <div className="cert-brand">
        <Nodey size={32} />
        <strong>{SITE.name}</strong>
      </div>
      <p className="cert-eyebrow">Certificate of completion</p>
      <p className="cert-small">This is to confirm that</p>
      <p className="cert-name">{cert.name}</p>
      <p className="cert-small">completed all 12 chapters of the free online course</p>
      <p className="cert-course">{SITE.course}</p>
      <dl className="cert-meta">
        <div>
          <dt>Issued</dt>
          <dd>{formatDate(cert.issued_at)}</dd>
        </div>
        <div>
          <dt>Certificate ID</dt>
          <dd>{cert.id}</dd>
        </div>
      </dl>
    </div>
  )
}
