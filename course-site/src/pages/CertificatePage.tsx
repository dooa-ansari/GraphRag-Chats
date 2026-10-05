import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { track } from '../analytics'
import {
  allChaptersDone,
  checkUrl,
  cleanName,
  fitsPdfFont,
  linkedInUrl,
  TABLE,
  type Certificate,
} from '../certificate'
import { CertificateCard } from '../components/CertificateCard'
import { Nodey } from '../components/Nodey'
import { chapters } from '../content'
import { nextChapter } from '../progress'
import { useProgress } from '../ProgressContext'
import { getSupabase, loginEnabled } from '../supabase'

/** The learner's own certificate: unlocks after all 12 chapters, when logged in. */
export function CertificatePage() {
  const { ready, done, email } = useProgress()
  const [cert, setCert] = useState<Certificate | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!email) return
    let cancelled = false
    void getSupabase().then(async (supabase) => {
      if (!supabase) return
      const { data, error } = await supabase.from(TABLE).select('id, name, issued_at').maybeSingle()
      if (cancelled) return
      if (error) setError('We could not load your certificate. Please refresh the page.')
      setCert(data ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [email])

  if (!ready || (email && cert === undefined && !error)) {
    return (
      <main className="narrow center">
        <Nodey size={64} />
        <p className="muted">Loading your certificate…</p>
      </main>
    )
  }

  if (!loginEnabled) {
    return (
      <main className="narrow center">
        <Nodey size={64} />
        <h1>Certificates are not switched on yet</h1>
        <Link className="primary" to="/">Back to the course</Link>
      </main>
    )
  }

  const finished = allChaptersDone(done)

  if (!finished) {
    const next = nextChapter(chapters, done)
    return (
      <main className="narrow center">
        <Nodey size={64} />
        <h1>Finish the course to get your certificate</h1>
        <p className="lede">
          You have completed {done.size} of {chapters.length} chapters. Mark every chapter complete and your certificate
          of completion unlocks here.
        </p>
        {next && (
          <Link className="primary" to={`/chapters/${next.slug}`}>
            Continue: Chapter {next.number}
          </Link>
        )}
      </main>
    )
  }

  if (!email) {
    return (
      <main className="narrow center">
        <Nodey size={64} happy />
        <h1>You finished the course!</h1>
        <p className="lede">Log in so we can save your certificate and give it a link anyone can check.</p>
        <Link className="primary" to="/login" state={{ from: '/certificate' }}>
          Log in to get your certificate
        </Link>
      </main>
    )
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const clean = cleanName(name)
    if (!clean) return setError('Please enter your name (2 to 80 characters).')
    if (!fitsPdfFont(clean)) return setError('Please write your name in Latin letters (A to Z, accents are fine).')
    const supabase = await getSupabase()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const query = cert
      ? supabase.from(TABLE).update({ name: clean }).eq('id', cert.id)
      : supabase.from(TABLE).insert({ name: clean })
    const { data, error } = await query.select('id, name, issued_at').single()
    setBusy(false)
    if (error) {
      setError(
        error.code === '42501'
          ? 'Your progress is still syncing to your account. Wait a moment and try again.'
          : 'We could not save your certificate. Please try again.',
      )
      return
    }
    if (!cert) track('certificate-created')
    setCert(data)
    setEditing(false)
  }

  if (!cert || editing) {
    return (
      <main className="narrow">
        <div className="login-card">
          <Nodey size={56} happy />
          <form onSubmit={save}>
            <h1>{cert ? 'Change the name on your certificate' : 'Get your certificate'}</h1>
            <p className="muted">
              Type your name as you want it on the certificate. Anyone with your certificate's link can see this name.
            </p>
            <label htmlFor="cert-name">Full name</label>
            <input
              id="cert-name"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : cert ? 'Save name' : 'Create my certificate'}
            </button>
            {cert && (
              <button type="button" className="linklike" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>
    )
  }

  const download = async () => {
    setBusy(true)
    try {
      const { downloadCertificatePdf } = await import('../certificatePdf')
      await downloadCertificatePdf(cert)
      track('certificate-download')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = () => {
    void navigator.clipboard?.writeText(checkUrl(cert.id)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="cert-page">
      <h1 className="rise">Your certificate</h1>
      <p className="lede rise">Congratulations on finishing {chapters.length} chapters. Download it, or add it to your LinkedIn profile.</p>
      <CertificateCard cert={cert} />
      <div className="cta-row">
        <button type="button" className="primary" onClick={() => void download()} disabled={busy}>
          {busy ? 'Preparing…' : 'Download PDF'}
        </button>
        <a
          className="secondary"
          href={linkedInUrl(cert)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('certificate-linkedin')}
        >
          Add to LinkedIn
        </a>
        <button type="button" className="secondary" onClick={copyLink}>
          {copied ? 'Link copied' : 'Copy check link'}
        </button>
      </div>
      <p className="small">
        The check link shows your name, the course and the date, so anyone can confirm the certificate is real. Name
        spelled wrong?{' '}
        <button
          type="button"
          className="linklike"
          onClick={() => {
            setName(cert.name)
            setEditing(true)
          }}
        >
          Change it
        </button>
        .
      </p>
    </main>
  )
}
