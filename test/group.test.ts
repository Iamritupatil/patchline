import { describe, expect, it } from 'vitest'
import { classify, fingerprint, normalizeMessage, topFrame } from '../src/group.js'
import type { AlertEvent } from '../src/ingest/types.js'

const ev = (over: Partial<AlertEvent> = {}): AlertEvent => ({
  source: 'generic',
  service: 'api',
  level: 'error',
  message: 'TypeError: Cannot read properties of undefined (reading "id")',
  count: 1,
  ...over,
})

describe('normalizeMessage', () => {
  it('strips volatile parts', () => {
    expect(normalizeMessage('Order 1234 failed for [UUID] at 2026-11-02T10:04:00Z: "boom"')).toBe(
      'Order <n> failed for <x> at <ts>: <str>',
    )
  })
})

describe('topFrame', () => {
  it('skips vendor frames and returns the first in-repo frame', () => {
    const stack = [
      'Error: boom',
      '    at Object.<anonymous> (/app/node_modules/express/lib/router.js:10:5)',
      '    at node:internal/process/task_queues:95:5',
      '    at handler (/app/server/src/billing.ts:42:13)',
    ].join('\n')
    expect(topFrame(stack)).toEqual({ file: 'src/billing.ts', line: 42, fn: 'handler' })
  })

  it('parses python frames', () => {
    expect(topFrame('Traceback:\n  File "/srv/app/main.py", line 7, in charge')).toEqual({
      file: 'app/main.py',
      line: 7,
      fn: 'charge',
    })
  })
})

describe('fingerprint', () => {
  it('groups the same bug across ids and line numbers', () => {
    const a = ev({ message: 'User 12 not found', stack: 'at load (src/users.ts:10:1)' })
    const b = ev({ message: 'User 99 not found', stack: 'at load (src/users.ts:14:3)' })
    expect(fingerprint(a)).toBe(fingerprint(b))
  })

  it('separates different services and locations', () => {
    expect(fingerprint(ev())).not.toBe(fingerprint(ev({ service: 'web' })))
    expect(fingerprint(ev({ stack: 'at a (src/a.ts:1:1)' }))).not.toBe(fingerprint(ev({ stack: 'at b (src/b.ts:1:1)' })))
  })
})

describe('classify', () => {
  it('errors are bugs, the rest is info', () => {
    expect(classify(ev())).toBe('bug')
    expect(classify(ev({ level: 'fatal' }))).toBe('bug')
    expect(classify(ev({ level: 'warning' }))).toBe('info')
    expect(classify(ev({ source: 'test' }))).toBe('info')
  })
})
