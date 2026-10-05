import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { App } from './App'
import { allPaths, headTags, pageMeta } from './seo'

export { allPaths, SITE } from './seo'

/** Renders one route to HTML for the prerender script. */
export function render(path: string): { html: string; head: string; indexable: boolean } {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  const meta = pageMeta(path)
  return { html, head: headTags(meta), indexable: !meta.noindex }
}

export const paths = allPaths
