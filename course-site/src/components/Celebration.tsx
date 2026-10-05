import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Nodey } from './Nodey'

export interface CelebrationHandle {
  celebrate: (title: string, text: string, from?: HTMLElement | null) => void
}

const COLORS = ['#3b82f6', '#60a5fa', '#22c55e', '#4ade80', '#f59e0b']

/** Nodey's toast plus a short confetti burst from a button. */
export const Celebration = forwardRef<CelebrationHandle>(function Celebration(_, ref) {
  const [message, setMessage] = useState<{ title: string; text: string } | null>(null)
  const [shown, setShown] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)

  useImperativeHandle(ref, () => ({
    celebrate(title, text, from) {
      setMessage({ title, text })
      setShown(true)
      clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => setShown(false), 4000)
      if (from && canvas.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        burst(canvas.current, from)
      }
    },
  }))

  return (
    <>
      <canvas ref={canvas} className="confetti" aria-hidden="true" />
      <div className={shown ? 'toast show' : 'toast'} role="status" aria-live="polite">
        <Nodey size={44} happy />
        <div>
          <strong>{message?.title}</strong>
          <span>{message?.text}</span>
        </div>
      </div>
    </>
  )
})

function burst(cv: HTMLCanvasElement, from: HTMLElement) {
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const dpr = devicePixelRatio || 1
  cv.width = innerWidth * dpr
  cv.height = innerHeight * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const r = from.getBoundingClientRect()
  const bits = Array.from({ length: 90 }, () => ({
    x: r.left + r.width / 2,
    y: r.top,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 11 - 4,
    s: 4 + Math.random() * 5,
    a: Math.random() * 6,
    va: (Math.random() - 0.5) * 0.3,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))
  const start = performance.now()
  const frame = (now: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    const life = (now - start) / 1600
    for (const b of bits) {
      b.vy += 0.35
      b.x += b.vx
      b.y += b.vy
      b.a += b.va
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - life)
      ctx.translate(b.x, b.y)
      ctx.rotate(b.a)
      ctx.fillStyle = b.c
      ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2)
      ctx.restore()
    }
    if (life < 1) requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, innerWidth, innerHeight)
  }
  requestAnimationFrame(frame)
}
