// Patchline reporter: sends crashes and server errors to Patchline, which texts the owner.
// No dependencies. Never throws. Reads PATCHLINE_URL from the environment.

const SERVICE = process.env.PATCHLINE_SERVICE ?? process.env.npm_package_name ?? 'app'

/** @param {unknown} err @param {{ url?: string, level?: 'error' | 'fatal' }} [extra] */
export async function reportError(err, extra = {}) {
  const endpoint = process.env.PATCHLINE_URL
  if (!endpoint) return
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err))
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service: SERVICE,
        level: extra.level ?? 'error',
        message: e.message || e.name,
        stack: e.stack,
        url: extra.url,
        environment: process.env.NODE_ENV,
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Reporting must never break the app.
  }
}

let installed = false

/** Reports uncaught errors, then exits like Node would have. Call once at startup (not in Next.js). */
export function installPatchline() {
  if (installed) return
  installed = true
  for (const event of ['uncaughtException', 'unhandledRejection']) {
    process.on(event, (err) => {
      console.error(err)
      void reportError(err, { level: 'fatal' }).finally(() => process.exit(1))
    })
  }
}

// ---- Browser section: copy into the client entry only if a public URL was configured ----
// Uses the public, origin-locked URL (NEXT_PUBLIC_PATCHLINE_URL / PATCHLINE_PUBLIC_URL), never PATCHLINE_URL.

/** @param {string | undefined} publicUrl */
export function installBrowserPatchline(publicUrl) {
  if (!publicUrl || typeof window === 'undefined') return
  const send = (message, stack) =>
    navigator.sendBeacon(publicUrl, JSON.stringify({ service: 'web', level: 'error', message, stack, url: location.pathname }))
  window.addEventListener('error', (e) => send(e.message, e.error?.stack))
  window.addEventListener('unhandledrejection', (e) => send(String(e.reason?.message ?? e.reason), e.reason?.stack))
}
