// Course progress is a set of completed chapter slugs. It always lives in
// localStorage, and is mirrored to Supabase when the learner is logged in.

const KEY = 'course-progress-v1'

export function readLocal(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function writeLocal(slugs: Iterable<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(slugs)].sort()))
  } catch {
    // Private mode or blocked storage: progress just lasts for this visit.
  }
}

/** Union of both sides, plus what still needs uploading to the server. */
export function mergeProgress(local: string[], remote: string[]) {
  const remoteSet = new Set(remote)
  const merged = [...new Set([...local, ...remote])].sort()
  const toUpload = [...new Set(local)].filter((slug) => !remoteSet.has(slug)).sort()
  return { merged, toUpload }
}

/** First chapter (in course order) that is not finished yet. */
export function nextChapter<T extends { slug: string }>(ordered: T[], done: Set<string>): T | undefined {
  return ordered.find((c) => !done.has(c.slug))
}
