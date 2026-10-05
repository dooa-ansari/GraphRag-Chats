import { useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { chapters } from '../content'
import { useProgress } from '../ProgressContext'
import { loginEnabled } from '../supabase'
import { toggleTheme } from '../theme'
import { GitHubButton } from './GitHubButton'
import { Nodey } from './Nodey'

export function Header() {
  const { ready, done, email } = useProgress()
  const themeBtn = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const count = chapters.filter((c) => done.has(c.slug)).length
  const total = chapters.length

  return (
    <header className="top">
      <Link to="/" className="brand" aria-label="Rehbar AI home">
        <Nodey size={34} />
        <span>
          Rehbar AI <small>Applied AI for Beginners</small>
        </span>
      </Link>
      <div className="course-progress" aria-label={`Course progress: ${count} of ${total} chapters done`}>
        <div className="meter">
          <i style={{ width: `${ready ? (count / total) * 100 : 0}%` }} />
        </div>
        <span>{ready ? `${count} of ${total}` : `0 of ${total}`}</span>
      </div>
      <GitHubButton place="header" />
      <button
        ref={themeBtn}
        className="icon-btn"
        onClick={() => toggleTheme(themeBtn.current)}
        aria-label="Switch between light and dark mode"
        title="Switch between light and dark mode"
      >
        <svg className="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg className="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      </button>
      {loginEnabled && (
        <Link to="/login" state={{ from: pathname }} className={email ? 'account' : 'login'}>
          {email ? <span className="account-email">{email}</span> : 'Log in'}
        </Link>
      )}
    </header>
  )
}
