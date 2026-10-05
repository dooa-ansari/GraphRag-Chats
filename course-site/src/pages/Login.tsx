import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { Nodey } from '../components/Nodey'
import { useProgress } from '../ProgressContext'
import { getSupabase, loginEnabled } from '../supabase'

const RETURN_KEY = 'login-return-to'

function readReturnTo(): string {
  try {
    const value = localStorage.getItem(RETURN_KEY)
    return value?.startsWith('/') ? value : '/'
  } catch {
    return '/'
  }
}

export function Login() {
  const { ready, email: signedInAs, signOut } = useProgress()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState('/')

  useEffect(() => {
    // Remember where the learner came from, so the email link (which may open
    // in a new tab) can bring them back there.
    const from = (location.state as { from?: string } | null)?.from
    if (from?.startsWith('/') && from !== '/login') {
      try {
        localStorage.setItem(RETURN_KEY, from)
      } catch {
        // ignore
      }
    }
    setReturnTo(from ?? readReturnTo())
  }, [location.state])

  if (!loginEnabled) {
    return (
      <main className="narrow center">
        <Nodey size={64} />
        <h1>Login is not switched on yet</h1>
        <p className="lede">Your progress is still saved on this device, so you can keep learning.</p>
        <Link className="primary" to="/">Back to the course</Link>
      </main>
    )
  }

  if (ready && signedInAs) {
    return (
      <main className="narrow center">
        <Nodey size={64} happy />
        <h1>You are logged in</h1>
        <p className="lede">
          Signed in as <strong>{signedInAs}</strong>. Your progress is saved to your account.
        </p>
        <div className="cta-row center">
          <Link className="primary" to={returnTo}>Continue learning</Link>
          <button type="button" className="secondary" onClick={() => void signOut()}>
            Log out
          </button>
        </div>
      </main>
    )
  }

  const sendLink = async (e?: FormEvent) => {
    e?.preventDefault()
    const supabase = await getSupabase()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/login`, shouldCreateUser: true },
    })
    setBusy(false)
    if (error) {
      setError(
        error.message.includes('fetch')
          ? 'We could not reach the login service. Check your connection and try again.'
          : error.message,
      )
    } else {
      setStep('sent')
    }
  }

  return (
    <main className="narrow">
      <div className="login-card">
        <Nodey size={56} />
        {step === 'email' ? (
          <form onSubmit={sendLink}>
            <h1>Log in to save your progress</h1>
            <p className="muted">
              No password needed. We email you a link, and you click it to log in. New here? The same link creates your
              account.
            </p>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a login link'}
            </button>
          </form>
        ) : (
          <div className="sent">
            <h1>Check your email</h1>
            <p className="muted">
              We sent a login link to <strong>{email}</strong>. Open it on this device to log in. The link works once and
              expires after an hour.
            </p>
            <p className="small">
              No email after a minute? Check your spam folder, or{' '}
              <button type="button" className="linklike" onClick={() => void sendLink()} disabled={busy}>
                {busy ? 'sending…' : 'send it again'}
              </button>
              .{' '}
              <button type="button" className="linklike" onClick={() => setStep('email')}>
                Use a different email
              </button>
            </p>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
