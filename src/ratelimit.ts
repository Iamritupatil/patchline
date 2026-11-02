// Fixed-window in-memory limiter. One control-plane process, so memory is enough.
const windows = new Map<string, { start: number; count: number }>()

export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const w = windows.get(key)
  if (!w || now - w.start >= windowMs) {
    if (windows.size > 50_000) windows.clear()
    windows.set(key, { start: now, count: 1 })
    return true
  }
  w.count++
  return w.count <= max
}
