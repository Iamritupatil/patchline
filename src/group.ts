import { sha256 } from './crypto.js'
import type { AlertEvent } from './ingest/types.js'

const NOISE: [RegExp, string][] = [
  [/\[[A-Z_]+\]/g, '<x>'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>'],
  [/\b\d{4}-\d{2}-\d{2}[t ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:z|[+-]\d{2}:?\d{2})?/gi, '<ts>'],
  [/\b0x[0-9a-f]+\b/gi, '<hex>'],
  [/\b[0-9a-f]{12,}\b/gi, '<hex>'],
  [/"[^"]*"|'[^']*'|`[^`]*`/g, '<str>'],
  [/\d+/g, '<n>'],
]

/** First line, with volatile parts (ids, numbers, quoted values, timestamps) removed. */
export function normalizeMessage(message: string): string {
  let out = message.split('\n')[0] ?? ''
  for (const [re, rep] of NOISE) out = out.replace(re, rep)
  return out.replace(/\s+/g, ' ').trim().slice(0, 300)
}

export type Frame = { file: string; line?: number; fn?: string }

const V8_FRAME = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+)(?::\d+)?\)?\s*$/
const PY_FRAME = /^\s*File "(.+?)", line (\d+)(?:, in (.+))?/
const VENDOR = /node_modules|^node:|^internal\/|<anonymous>|site-packages|\/usr\/lib\//

const shortPath = (p: string) =>
  p
    .replace(/^file:\/\//, '')
    .replace(/\\/g, '/')
    .split('/')
    .slice(-2)
    .join('/')

/** Top in-repo stack frame (skips node_modules / runtime internals). */
export function topFrame(stack: string | undefined): Frame | undefined {
  if (!stack) return undefined
  for (const line of stack.split('\n')) {
    const v8 = V8_FRAME.exec(line)
    if (v8?.[2] && !VENDOR.test(v8[2])) return { file: shortPath(v8[2]), line: Number(v8[3]), fn: v8[1] }
    const py = PY_FRAME.exec(line)
    if (py?.[1] && !VENDOR.test(py[1])) return { file: shortPath(py[1]), line: Number(py[2]), fn: py[3] }
  }
  return undefined
}

/** Same bug → same fingerprint, even across deploys (line numbers excluded). */
export function fingerprint(ev: AlertEvent): string {
  const frame = topFrame(ev.stack)
  const where = frame ? `${frame.file}#${frame.fn ?? ''}` : ''
  return sha256(`${ev.service}\n${normalizeMessage(ev.message)}\n${where}`).slice(0, 16)
}

export type Kind = 'bug' | 'info'

export function classify(ev: AlertEvent): Kind {
  if (ev.source === 'test') return 'info'
  return ev.level === 'error' || ev.level === 'fatal' ? 'bug' : 'info'
}

export const TERMINAL = new Set(['shipped', 'ignored', 'failed'])
