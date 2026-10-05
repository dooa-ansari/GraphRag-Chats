import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState('Copy')
  const copy = () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => setLabel('Copied'))
      .catch(() => setLabel('Copy failed'))
      .finally(() => setTimeout(() => setLabel('Copy'), 1500))
  }
  return (
    <button type="button" onClick={copy}>
      {label}
    </button>
  )
}
