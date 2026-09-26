import { createContext } from 'react'

// "down": the usual link, leaving a node's bottom and arriving at the other node's top.
// "up": a reverse link (e.g. child to parent), leaving a node's top and arriving
// at the other node's bottom.
export type LinkDirection = 'down' | 'up'

// Tracks which node (if any) is waiting to be linked to another node, so a
// node's "+" / "↑" buttons and the canvas' node-click handler can cooperate.
export type LinkContextValue = {
  linking: { nodeId: string; direction: LinkDirection } | null
  toggleLink: (nodeId: string, direction: LinkDirection) => void
}

export const LinkContext = createContext<LinkContextValue>({
  linking: null,
  toggleLink: () => {},
})
