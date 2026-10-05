import { chapters, getChapter } from './content'

export const SITE = {
  name: 'Rehbar AI',
  course: 'Applied AI for Beginners',
  url: ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://rehbarai.com').replace(/\/$/, ''),
  instagram: 'https://www.instagram.com/rehbar.ra/',
  repo: 'https://github.com/dooa-ansari/GraphRag-Chats',
}

export interface PageMeta {
  path: string
  title: string
  description: string
  image: string
  noindex?: boolean
  jsonLd?: object
}

const courseDescription =
  'A free 5-day beginner course in applied AI: LLMs, OpenRouter, embeddings, vector search, RAG, knowledge graphs and GraphRAG, with a real open-source app to practise on.'

function courseJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: SITE.course,
    description: courseDescription,
    url: `${SITE.url}/`,
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalLevel: 'Beginner',
    teaches: ['Large language models', 'Embeddings', 'Vector search', 'RAG', 'Knowledge graphs', 'GraphRAG'],
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url, sameAs: [SITE.instagram] },
    offers: [{ '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'EUR' }],
    hasCourseInstance: [{ '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT10H' }],
    syllabusSections: chapters.map((c) => ({
      '@type': 'Syllabus',
      name: `Chapter ${c.number}: ${c.title}`,
      description: c.description,
      timeRequired: `PT${c.minutes}M`,
    })),
  }
}

/** Metadata for every route; unknown paths get the 404 page's. */
export function pageMeta(path: string): PageMeta {
  const image = `${SITE.url}/og/home.png`
  if (path === '/') {
    return {
      path,
      title: `${SITE.course}: learn LLMs, RAG and GraphRAG in 5 days | ${SITE.name}`,
      description: courseDescription,
      image,
      jsonLd: courseJsonLd(),
    }
  }
  const chapterMatch = path.match(/^\/chapters\/([^/]+)\/?$/)
  const chapter = chapterMatch ? getChapter(chapterMatch[1]) : undefined
  if (chapter) {
    return {
      path: `/chapters/${chapter.slug}`,
      title: `${chapter.title} · Chapter ${chapter.number} | ${SITE.name}`,
      description: chapter.description,
      image: `${SITE.url}/og/${chapter.slug}.png`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: chapter.title,
        description: chapter.description,
        url: `${SITE.url}/chapters/${chapter.slug}`,
        timeRequired: `PT${chapter.minutes}M`,
        educationalLevel: 'Beginner',
        isAccessibleForFree: true,
        position: chapter.number,
        isPartOf: { '@type': 'Course', name: SITE.course, url: `${SITE.url}/` },
      },
    }
  }
  if (path === '/privacy') {
    return { path, title: `Privacy | ${SITE.name}`, description: `How ${SITE.name} handles your email, progress and visit data.`, image }
  }
  if (path === '/certificate') {
    return { path, title: `Your certificate | ${SITE.name}`, description: `Get your certificate of completion for ${SITE.course}.`, image, noindex: true }
  }
  if (path.startsWith('/certificate/')) {
    return { path, title: `Certificate check | ${SITE.name}`, description: `Check a certificate of completion for ${SITE.course}.`, image, noindex: true }
  }
  if (path === '/login') {
    return { path, title: `Log in | ${SITE.name}`, description: 'Log in with a link sent to your email to save your course progress.', image, noindex: true }
  }
  return { path, title: `Page not found | ${SITE.name}`, description: courseDescription, image, noindex: true }
}

/**
 * Path of the shared shell nginx serves for every /certificate/<id> link
 * (see nginx.conf.template).
 */
export const CERTIFICATE_SHELL = '/certificate/check'

/** Every path that gets its own prerendered HTML file. */
export function allPaths(): string[] {
  return ['/', ...chapters.map((c) => `/chapters/${c.slug}`), '/privacy', '/certificate', CERTIFICATE_SHELL, '/login', '/404']
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function headTags(meta: PageMeta): string {
  const url = `${SITE.url}${meta.path}`
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${meta.path.startsWith('/chapters/') ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${meta.image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
  ]
  if (meta.jsonLd) {
    // `<` is escaped so chapter text can never close the script tag.
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`)
  }
  return tags.join('\n    ')
}
