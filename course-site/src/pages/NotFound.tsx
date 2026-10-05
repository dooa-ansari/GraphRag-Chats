import { Link } from 'react-router'
import { Nodey } from '../components/Nodey'

export function NotFound() {
  return (
    <main className="narrow center">
      <Nodey size={72} />
      <h1>This page is not here</h1>
      <p className="lede">Nodey looked everywhere. Try the course home page instead.</p>
      <Link className="primary" to="/">
        Go to the course
      </Link>
    </main>
  )
}
