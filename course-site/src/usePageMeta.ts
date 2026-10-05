import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { pageMeta } from './seo'

/** Keeps the tab title and description right after in-app navigation. */
export function usePageMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = pageMeta(pathname)
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    window.scrollTo(0, 0)
  }, [pathname])
}
