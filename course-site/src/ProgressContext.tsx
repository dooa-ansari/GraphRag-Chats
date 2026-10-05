import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { track } from './analytics'
import { mergeProgress, readLocal, writeLocal } from './progress'
import { getSupabase } from './supabase'

const TABLE = 'course_progress'

interface ProgressValue {
  /** False on the server and during the first client render (avoids hydration mismatches). */
  ready: boolean
  done: Set<string>
  email: string | null
  markComplete: (slug: string) => void
  markIncomplete: (slug: string) => void
  signOut: () => Promise<void>
}

const ProgressContext = createContext<ProgressValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const [email, setEmail] = useState<string | null>(null)
  const userId = useRef<string | null>(null)

  const sync = useCallback(async (uid: string) => {
    const supabase = await getSupabase()
    if (!supabase) return
    const { data, error } = await supabase.from(TABLE).select('chapter_slug')
    if (error) return
    const { merged, toUpload } = mergeProgress(
      readLocal(),
      data.map((row: { chapter_slug: string }) => row.chapter_slug),
    )
    if (toUpload.length) {
      await supabase.from(TABLE).upsert(toUpload.map((chapter_slug) => ({ user_id: uid, chapter_slug })))
    }
    writeLocal(merged)
    setDone(new Set(merged))
  }, [])

  useEffect(() => {
    setDone(new Set(readLocal()))
    setReady(true)

    const cameFromEmailLink = window.location.hash.includes('access_token')
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    void getSupabase().then((supabase) => {
      if (!supabase || cancelled) return
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        userId.current = session?.user.id ?? null
        setEmail(session?.user.email ?? null)
        if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          // Supabase asks not to await its own calls inside this callback.
          setTimeout(() => void sync(session.user.id), 0)
        }
        if (event === 'SIGNED_IN' && cameFromEmailLink) track('login', { method: 'link' })
      })
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [sync])

  const markComplete = useCallback((slug: string) => {
    setDone((prev) => {
      const next = new Set(prev).add(slug)
      writeLocal(next)
      return next
    })
    track('chapter-complete', { chapter: slug })
    const uid = userId.current
    if (uid) void getSupabase().then((supabase) => supabase?.from(TABLE).upsert({ user_id: uid, chapter_slug: slug }))
  }, [])

  const markIncomplete = useCallback((slug: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      next.delete(slug)
      writeLocal(next)
      return next
    })
    if (userId.current) void getSupabase().then((supabase) => supabase?.from(TABLE).delete().eq('chapter_slug', slug))
  }, [])

  const signOut = useCallback(async () => {
    await (await getSupabase())?.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({ ready, done, email, markComplete, markIncomplete, signOut }),
    [ready, done, email, markComplete, markIncomplete, signOut],
  )
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>')
  return value
}
