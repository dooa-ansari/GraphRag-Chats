import { Link } from 'react-router'
import { GitHubButton } from '../components/GitHubButton'
import { HeroGraph } from '../components/HeroGraph'
import { ChapterList } from '../components/ChapterList'
import { chapters, days } from '../content'
import { nextChapter } from '../progress'
import { useProgress } from '../ProgressContext'

export function Home() {
  const { ready, done } = useProgress()
  const next = ready ? nextChapter(chapters, done) : chapters[0]
  const started = ready && done.size > 0
  const finished = ready && !next

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow-line rise">Free · 5 days · 12 short chapters · certificate</p>
          <h1 className="rise">
            Learn applied AI in 5 days, and build your own <span className="hl">GraphRAG</span> app.
          </h1>
          <p className="lede rise">
            From "what is an LLM?" to an AI that answers questions from a knowledge graph you built yourself. About 2
            hours a day. No maths or machine learning background needed.
          </p>
          <div className="cta-row rise">
            {finished ? (
              <Link className="primary" to="/certificate">
                You finished the course. Get your certificate
              </Link>
            ) : (
              <Link className="primary" to={`/chapters/${next!.slug}`}>
                {started ? `Continue: Chapter ${next!.number}` : 'Start Chapter 1'}
              </Link>
            )}
            <a className="secondary" href="#plan">
              See the 5-day plan
            </a>
          </div>
          <div className="gh-row rise">
            <GitHubButton place="hero" />
            <p className="small">The practice app is open source. A star helps other beginners find it.</p>
          </div>
        </div>
        <HeroGraph />
      </section>

      <section className="facts">
        <div>
          <h2>Who it is for</h2>
          <p>Beginners who can use a terminal and read a little Python.</p>
        </div>
        <div>
          <h2>What you finish with</h2>
          <p>GraphRAG Chats running on your machine, a graph you built, and a clear picture of how an LLM turns search results into answers.</p>
        </div>
        <div>
          <h2>What it costs</h2>
          <p>Nothing. The practice app runs locally with Docker and uses free AI models.</p>
        </div>
        <div>
          <h2>Your certificate</h2>
          <p>
            Finish all 12 chapters and get a certificate of completion with your name. Download it as a PDF, add it to
            LinkedIn, and share a link anyone can check.
          </p>
        </div>
      </section>

      <section id="plan" className="plan">
        <h2>The 5-day plan</h2>
        <div className="plan-grid">
          <ol className="day-list">
            {days.map((d) => (
              <li key={d.day}>
                <b>Day {d.day}</b>
                <span>{d.theme}</span>
                <small>{d.hours}</small>
              </li>
            ))}
          </ol>
          <nav className="plan-chapters" aria-label="All chapters">
            <ChapterList />
          </nav>
        </div>
      </section>
    </main>
  )
}
