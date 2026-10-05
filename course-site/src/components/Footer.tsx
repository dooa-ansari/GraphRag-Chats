import { Link } from 'react-router'
import { SITE } from '../seo'

export function Footer() {
  return (
    <footer className="footer">
      <span>
        © {SITE.name}. Made for beginners, free forever.
      </span>
      <nav aria-label="Footer">
        <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href={SITE.repo} target="_blank" rel="noopener noreferrer">GraphRAG Chats on GitHub</a>
        <Link to="/privacy">Privacy</Link>
      </nav>
    </footer>
  )
}
