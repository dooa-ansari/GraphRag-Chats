import { useEffect, useState } from 'react'

/** Thin bar along the top showing how far down the page you are. */
export function ReadingBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      setPct(h > 0 ? Math.min(100, (scrollY / h) * 100) : 0)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="read-bar" aria-hidden="true">
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}
