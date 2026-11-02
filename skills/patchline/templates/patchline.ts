// Patchline reporter: sends crashes and server errors to Patchline, which texts the owner.
// No dependencies. Never throws. Reads PATCHLINE_URL from the environment.

const SERVICE = process.env.PATCHLINE_SERVICE ?? process.env.npm_package_name ?? 'app'

export async function reportError(err: unknown, extra: { url?: string; level?: 'error' | 'fatal' } = {}): Promise<void> {
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
export function installPatchline(): void {
  if (installed) return
  installed = true
  for (const event of ['uncaughtException', 'unhandledRejection'] as const) {
    process.on(event, (err: unknown) => {
      console.error(err)
      void reportError(err, { level: 'fatal' }).finally(() => process.exit(1))
    })
  }
}
