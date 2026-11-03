// Fixed-window in-memory limiter. One control-plane process, so memory is enough.
const windows = new Map<string, { until: number; count: number }>()
const MAX_KEYS = 50_000

/** Never wipe every window when full (that would reset the `start:` guess limit): drop expired, then oldest. */
function evict(now: number): void {
  for (const [k, w] of windows) if (now >= w.until) windows.delete(k)
  for (const k of windows.keys()) {
    if (windows.size <= MAX_KEYS * 0.9) break
    windows.delete(k)
  }
}

export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const w = windows.get(key)
  if (!w || now >= w.until) {
    if (windows.size >= MAX_KEYS) evict(now)
    windows.set(key, { until: now + windowMs, count: 1 })
    return true
  }
  w.count++
  return w.count <= max
}

/** The hop our proxy appended (right-most), not the client-controlled left-most entry. */
export const clientIp = (h: (n: string) => string | undefined) =>
  h('x-forwarded-for')?.split(',').pop()?.trim() || h('x-real-ip') || 'unknown'
