// Draws the 1200x630 share images (public/og/*.png) that WhatsApp, LinkedIn
// and friends show when someone posts a link to the course. Run it again
// after renaming a chapter:
//
//   npm run og                    (uses Chromium from Playwright's cache)
//   CHROMIUM_PATH=/path/to/chrome npm run og
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'og')
const fontDir = path.join(root, 'scripts', 'og-fonts')
const font = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(fontDir, file)).toString('base64')}`

const chapters = fs
  .readdirSync(path.join(root, 'content', 'chapters'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = fs.readFileSync(path.join(root, 'content', 'chapters', f), 'utf8')
    const field = (key) => raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim()
    return { slug: field('slug'), number: field('number'), title: field('title'), day: field('day'), minutes: field('minutes') }
  })

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const nodey = `<svg width="120" height="120" viewBox="0 0 40 40"><rect x="6" y="8" width="28" height="26" rx="7" fill="#3b82f6"/><rect x="10" y="13" width="20" height="12" rx="4" fill="#070b14"/><circle cx="16" cy="19" r="2.4" fill="#60a5fa"/><circle cx="24" cy="19" r="2.4" fill="#60a5fa"/><line x1="20" y1="8" x2="20" y2="3" stroke="#3b82f6" stroke-width="2"/><circle cx="20" cy="3" r="2" fill="#22c55e"/></svg>`

function card({ eyebrow, title, footer }) {
  return `<!doctype html><html><head><style>
    @font-face { font-family: Display; src: url(${font('SpaceGrotesk-700.woff2')}); font-weight: 700; }
    @font-face { font-family: Body; src: url(${font('Inter-500.woff2')}); font-weight: 500; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; background: #070b14; color: #f4f6fb; font-family: Body, sans-serif;
      display: flex; flex-direction: column; justify-content: space-between; padding: 72px 80px; position: relative; overflow: hidden; }
    .grid { position: absolute; inset: 0; background-image: radial-gradient(#1f2a40 1.5px, transparent 1.5px); background-size: 36px 36px; opacity: .7; }
    .glow { position: absolute; right: -160px; top: -160px; width: 560px; height: 560px; border-radius: 50%; background: radial-gradient(#1d4ed8 0%, transparent 65%); opacity: .45; }
    .top, .bottom { position: relative; display: flex; align-items: center; justify-content: space-between; }
    .eyebrow { font-size: 28px; color: #60a5fa; letter-spacing: .04em; }
    h1 { position: relative; font-family: Display, sans-serif; font-size: ${title.length > 34 ? 72 : 84}px; line-height: 1.05; letter-spacing: -.02em; max-width: 900px; }
    .brand { font-family: Display, sans-serif; font-size: 34px; }
    .brand span { color: #94a0b8; font-family: Body, sans-serif; font-size: 26px; margin-left: 14px; }
    .pill { font-size: 24px; color: #4ade80; border: 2px solid #4ade80; border-radius: 99px; padding: 8px 22px; }
  </style></head><body>
    <div class="grid"></div><div class="glow"></div>
    <div class="top"><div class="eyebrow">${esc(eyebrow)}</div>${nodey}</div>
    <h1>${esc(title)}</h1>
    <div class="bottom"><div class="brand">Rehbar AI<span>Applied AI for Beginners</span></div><div class="pill">${esc(footer)}</div></div>
  </body></html>`
}

const pages = [
  { file: 'home', eyebrow: 'FREE · 5 DAYS · 12 CHAPTERS', title: 'Learn applied AI and build your own GraphRAG app', footer: 'Free course' },
  ...chapters.map((c) => ({
    file: c.slug,
    eyebrow: `DAY ${c.day} · CHAPTER ${c.number}`,
    title: c.title,
    footer: `${c.minutes} min`,
  })),
]

const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
fs.mkdirSync(outDir, { recursive: true })
for (const p of pages) {
  await page.setContent(card(p))
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(outDir, `${p.file}.png`) })
  console.log(`og/${p.file}.png`)
}
await browser.close()
