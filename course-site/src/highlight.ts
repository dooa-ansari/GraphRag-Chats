import type { Element, ElementContent, Root, RootContent } from 'hast'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import { createLowlight } from 'lowlight'

// Only the languages the chapters use; the full highlight.js set would
// triple the size of the site's JavaScript.
const lowlight = createLowlight({ bash, python })

function textOf(node: ElementContent | RootContent): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(textOf).join('') : ''
}

function walk(node: Root | Element) {
  for (const child of node.children) {
    if (child.type !== 'element') continue
    const lang = child.tagName === 'code' && node.type === 'element' && node.tagName === 'pre'
      ? String((child.properties.className as string[] | undefined)?.find((c) => c.startsWith('language-')) ?? '').slice(9)
      : ''
    if (lang && lowlight.registered(lang)) {
      child.children = lowlight.highlight(lang, textOf(child)).children as ElementContent[]
    } else {
      walk(child)
    }
  }
}

/** Rehype plugin: syntax-highlights fenced code blocks in known languages. */
export function rehypeCodeHighlight() {
  return (tree: Root) => walk(tree)
}
