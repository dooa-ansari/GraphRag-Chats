const KEY = 'theme'

export type Theme = 'light' | 'dark'

export function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Flips the theme, revealing the new one in a circle grown from `origin`. */
export function toggleTheme(origin?: HTMLElement | null): void {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  const apply = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // ignore
    }
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce || !origin) {
    apply()
    return
  }
  const r = origin.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const transition = document.startViewTransition(apply)
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}
