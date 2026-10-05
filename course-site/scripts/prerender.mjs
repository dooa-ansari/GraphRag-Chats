// Turns the built single-page app into one real HTML file per route, so
// search engines and link previews see each chapter's own title and text.
// Runs after `vite build` (client) and `vite build --ssr` (server bundle).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const { render, paths, SITE } = await import(path.join(root, 'dist-ssr', 'entry-server.js'))

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
// Same VITE_* values the client build saw (.env files plus the environment).
const umamiId = loadEnv('production', root, 'VITE_').VITE_UMAMI_WEBSITE_ID
const analytics = umamiId
  ? `<script defer src="https://cloud.umami.is/script.js" data-website-id="${umamiId.replace(/[^\w-]/g, '')}"></script>`
  : ''

const indexable = []
for (const url of paths()) {
  const { html, head } = render(url)
  const page = template
    .replace('<!--app-head-->', head)
    .replace('<!--analytics-->', analytics)
    .replace('<!--app-html-->', html)
  const file =
    url === '/' ? 'index.html' : url === '/404' ? '404.html' : path.join(url.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true })
  fs.writeFileSync(path.join(dist, file), page)
  if (!['/login', '/404'].includes(url)) indexable.push(url)
  console.log(`prerendered ${url} -> ${file}`)
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((u) => `  <url><loc>${SITE.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /login\n\nSitemap: ${SITE.url}/sitemap.xml\n`)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`wrote sitemap.xml with ${indexable.length} pages`)
