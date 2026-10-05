/** Nodey, the course mascot: a little card-shaped robot. */
export function Nodey({ size = 36, happy = false, className = '' }: { size?: number; happy?: boolean; className?: string }) {
  const body = happy ? 'var(--done)' : 'var(--accent)'
  return (
    <svg className={`nodey ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="6" y="8" width="28" height="26" rx="7" fill={body} />
      <rect x="10" y="13" width="20" height="12" rx="4" fill="var(--bg)" />
      {happy ? (
        <path d="M13.5 19.5q2.5-3 5 0M21.5 19.5q2.5-3 5 0" stroke={body} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="16" cy="19" r="2.4" fill={body} />
          <circle cx="24" cy="19" r="2.4" fill={body} />
        </>
      )}
      <line x1="20" y1="8" x2="20" y2="3" stroke={body} strokeWidth="2" />
      <circle cx="20" cy="3" r="2" fill={happy ? 'var(--tip)' : 'var(--done)'} />
    </svg>
  )
}
