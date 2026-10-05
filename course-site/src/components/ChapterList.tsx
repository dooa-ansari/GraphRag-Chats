import { Link } from 'react-router'
import { chapters, days } from '../content'
import { useProgress } from '../ProgressContext'

const Check = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2 6.5l2.5 2.5L10 3.5" />
  </svg>
)

/** Chapters grouped by day, with a tick for each finished one. */
export function ChapterList({ current }: { current?: string }) {
  const { done } = useProgress()
  return (
    <>
      {days.map((d) => (
        <div key={d.day}>
          <div className="day">
            Day {d.day} · {d.theme}
          </div>
          <ul className="chapters">
            {chapters
              .filter((c) => c.day === d.day)
              .map((c) => {
                const classes = [done.has(c.slug) && 'done', c.slug === current && 'current'].filter(Boolean).join(' ')
                return (
                  <li key={c.slug}>
                    <Link to={`/chapters/${c.slug}`} className={classes} aria-current={c.slug === current ? 'page' : undefined}>
                      <span className="dot">
                        <Check />
                      </span>
                      <span>
                        <span className="num">{c.number}.</span> {c.navTitle}
                      </span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </>
  )
}
