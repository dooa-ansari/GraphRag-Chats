import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeCodeHighlight } from '../highlight'
import { CopyButton } from './CopyButton'

const components: Components = {
  a({ href, children }) {
    const external = href?.startsWith('http')
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  pre({ children, node }) {
    // The <code> child carries the language as "language-xyz".
    const code = node?.children[0]
    const className = code && 'properties' in code ? String(code.properties.className ?? '') : ''
    const language = className.match(/language-([\w-]+)/)?.[1]
    const text = code && 'children' in code ? collectText(code.children) : ''
    return (
      <div className="code">
        <div className="code-head">
          <span>{language ?? 'text'}</span>
          <CopyButton text={text} />
        </div>
        <pre>{children}</pre>
      </div>
    )
  },
  table({ children }) {
    return (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    )
  },
}

type HastLike = { type: string; value?: string; children?: HastLike[] }

function collectText(nodes: HastLike[]): string {
  return nodes.map((n) => (n.type === 'text' ? (n.value ?? '') : collectText(n.children ?? []))).join('')
}

export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCodeHighlight]} components={components}>
      {text}
    </ReactMarkdown>
  )
}
