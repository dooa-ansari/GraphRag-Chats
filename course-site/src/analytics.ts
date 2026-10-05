declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void }
  }
}

/** Sends a custom event to Umami when the tracking script is loaded. */
export function track(event: string, data?: Record<string, string | number>): void {
  try {
    window.umami?.track(event, data)
  } catch {
    // Analytics must never break the page.
  }
}
