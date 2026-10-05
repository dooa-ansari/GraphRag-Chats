import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Celebration, type CelebrationHandle } from '../components/Celebration'
import { ChapterList } from '../components/ChapterList'
import { FlowDiagram } from '../components/FlowDiagram'
import { Markdown } from '../components/Markdown'
import { ReadingBar } from '../components/ReadingBar'
import { chapters, getChapter } from '../content'
import { useProgress } from '../ProgressContext'
import { loginEnabled } from '../supabase'
import { NotFound } from './NotFound'

export function ChapterPage() {
  const { slug } = useParams()
  const chapter = getChapter(slug)
  const { ready, done, email, markComplete, markIncomplete } = useProgress()
  const [showAnswers, setShowAnswers] = useState(false)
  const celebration = useRef<CelebrationHandle>(null)
  const completeBtn = useRef<HTMLButtonElement>(null)

  if (!chapter) return <NotFound />
  const index = chapters.indexOf(chapter)
  const prev = chapters[index - 1]
  const next = chapters[index + 1]
  const isDone = ready && done.has(chapter.slug)
  const doneCount = chapters.filter((c) => done.has(c.slug) || c.slug === chapter.slug).length

  const complete = () => {
    markComplete(chapter.slug)
    const last = doneCount === chapters.length
    celebration.current?.celebrate(
      last ? 'You finished the course!' : `Chapter ${chapter.number} done!`,
      last
        ? 'All 12 chapters complete. Nodey is very proud of you.'
        : next
          ? `${email ? 'Progress saved to your account.' : 'Progress saved on this device.'} Next up: ${next.navTitle}.`
          : 'Progress saved.',
      completeBtn.current,
    )
  }

  return (
    <div className="shell" key={chapter.slug}>
      <ReadingBar />
      <nav className="rail" aria-label="Chapters">
        <details>
          <summary>
            All chapters{ready ? ` · ${done.size} of ${chapters.length} done` : ''}
          </summary>
          <ChapterList current={chapter.slug} />
        </details>
        <div className="rail-desktop">
          <ChapterList current={chapter.slug} />
        </div>
      </nav>

      <main className="article-wrap">
        <article>
          <div className="eyebrow rise">
            <span className="chip">
              Day {chapter.day} · Chapter {chapter.number}
            </span>
            <span className="chip">about {chapter.minutes} minutes</span>
            {isDone && <span className="chip chip-done">Completed</span>}
          </div>
          <h1 className="rise">{chapter.title}</h1>
          <p className="lede rise">{chapter.description}</p>

          <div className="prose rise">
            {chapter.parts.map((part, i) =>
              part.kind === 'diagram' ? <FlowDiagram key={i} name={part.name} /> : <Markdown key={i} text={part.text} />,
            )}
          </div>

          {chapter.answers && (
            <div className="answers">
              <button type="button" className="ghost" aria-expanded={showAnswers} onClick={() => setShowAnswers((v) => !v)}>
                {showAnswers ? 'Hide answers' : 'Show answers'}
              </button>
              <div className={showAnswers ? 'answers-body open' : 'answers-body'} hidden={!showAnswers}>
                <Markdown text={chapter.answers} />
              </div>
            </div>
          )}

          <div className="finish">
            {isDone ? (
              <>
                <p>
                  <strong>You finished this chapter.</strong>{' '}
                  {next ? 'On to the next one when you are ready.' : 'That was the last one. Well done!'}
                </p>
                <button type="button" className="ghost" onClick={() => markIncomplete(chapter.slug)}>
                  Mark as not done
                </button>
              </>
            ) : (
              <>
                <p>
                  Done reading and tried the practice task? Mark the chapter complete to save your progress.
                  {ready && loginEnabled && !email && (
                    <>
                      {' '}
                      It is saved on this device; <Link to="/login" state={{ from: `/chapters/${chapter.slug}` }}>log in</Link> to keep it on all your devices.
                    </>
                  )}
                </p>
                <button type="button" ref={completeBtn} className="complete" onClick={complete}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  Mark chapter complete
                </button>
              </>
            )}
          </div>

          <nav className="pager" aria-label="Previous and next chapter">
            {prev ? (
              <Link to={`/chapters/${prev.slug}`} className="pager-link">
                <small>Previous</small>
                {prev.number}. {prev.navTitle}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/chapters/${next.slug}`} className="pager-link next">
                <small>Next</small>
                {next.number}. {next.navTitle}
              </Link>
            )}
          </nav>
        </article>
      </main>
      <Celebration ref={celebration} />
    </div>
  )
}
