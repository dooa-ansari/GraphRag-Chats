import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isCertificateId, type Certificate } from '../certificate'
import { CertificateCard } from '../components/CertificateCard'
import { Nodey } from '../components/Nodey'
import { SITE } from '../seo'
import { getSupabase } from '../supabase'

type State = { kind: 'loading' } | { kind: 'found'; cert: Certificate } | { kind: 'missing' } | { kind: 'error' }

/**
 * Public page behind each certificate's link, e.g. /certificate/RA-1A2B3C4D.
 * All IDs share one prerendered shell, so the first render never shows the ID.
 */
export function CertificateCheck() {
  const { id } = useParams()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!isCertificateId(id)) {
      setState({ kind: 'missing' })
      return
    }
    let cancelled = false
    setState({ kind: 'loading' })
    void getSupabase().then(async (supabase) => {
      if (!supabase) return !cancelled && setState({ kind: 'error' })
      const { data, error } = await supabase.rpc('certificate_by_id', { cert_id: id })
      if (cancelled) return
      if (error) setState({ kind: 'error' })
      else if (Array.isArray(data) && data[0]) setState({ kind: 'found', cert: data[0] as Certificate })
      else setState({ kind: 'missing' })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (state.kind === 'found') {
    return (
      <main className="cert-page">
        <p className="verified rise">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Real certificate, issued by {SITE.name}
        </p>
        <CertificateCard cert={state.cert} />
        <p className="small">
          {state.cert.name} marked all 12 chapters of {SITE.course} as complete. The course is free and covers LLMs,
          embeddings, vector search, RAG, knowledge graphs and GraphRAG. This is a certificate of completion, not an
          accredited qualification.
        </p>
        <div className="cta-row">
          <Link className="primary" to="/">See the course</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="narrow center">
      <Nodey size={64} />
      {state.kind === 'loading' ? (
        <p className="muted">Checking the certificate…</p>
      ) : (
        <>
          <h1>{state.kind === 'missing' ? 'Certificate not found' : 'We could not check this certificate'}</h1>
          <p className="lede">
            {state.kind === 'missing'
              ? 'There is no certificate with this ID. Check that the link was copied in full.'
              : 'Please refresh the page in a moment.'}
          </p>
          <Link className="primary" to="/">Go to the course</Link>
        </>
      )}
    </main>
  )
}
