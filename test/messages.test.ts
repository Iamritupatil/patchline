import { describe, expect, it } from 'vitest'
import type { Incident } from '../src/incidents.js'
import { alertText, friendlyTime, plainWhere } from '../src/messages.js'

// 2026-11-02 08:34 UTC = 2:04 PM in India
const T = Date.UTC(2026, 10, 2, 8, 34)

const inc = (over: Partial<Incident> = {}, sample: Record<string, unknown> = {}): Incident => ({
  id: 7,
  tenant_id: 't',
  fingerprint: 'f',
  kind: 'bug',
  status: 'open',
  service: 'notchman-api',
  title: 'TypeError: x',
  sample: JSON.stringify({ message: 'TypeError: x', level: 'error', ...sample }),
  regression: 0,
  count: 1,
  first_seen: T,
  last_seen: T,
  diagnosis: null,
  ...over,
})

describe('friendlyTime', () => {
  it('uses 12-hour time in the owner’s zone', () => {
    expect(friendlyTime(T, 'Asia/Kolkata', T)).toBe('2:04 PM')
  })
  it('adds the date for older events', () => {
    expect(friendlyTime(T, 'Asia/Kolkata', T + 2 * 86_400_000)).toBe('Nov 2, 2:04 PM')
  })
})

describe('plainWhere', () => {
  it('names the area from the file, skipping generic names', () => {
    expect(plainWhere({ file: 'src/billing.ts' }, undefined)).toBe('The billing part of your app')
    expect(plainWhere({ file: 'userProfile/index.ts' }, undefined)).toBe('The user profile part of your app')
  })
  it('falls back to the page path', () => {
    expect(plainWhere(undefined, 'https://x.io/checkout?step=2')).toBe('The /checkout page')
    expect(plainWhere(undefined, undefined)).toBeUndefined()
  })
})

describe('alertText', () => {
  it('is plain English, no stack or error type', () => {
    const text = alertText(inc({ count: 12 }), { file: 'src/billing.ts', line: 42 }, { timeZone: 'Asia/Kolkata', fixesEnabled: true })
    expect(text).toBe(
      [
        '🔴 notchman-api has a problem',
        'The billing part of your app is failing.',
        'Started 2:04 PM · 12 times so far',
        "I'm looking into it and will text you a fix to approve shortly.",
        'Reply "details" for the technical info.',
      ].join('\n'),
    )
    expect(text).not.toMatch(/TypeError|\.ts|UTC/)
  })

  it('mentions regressions and offers ignore when fixes are off', () => {
    const text = alertText(inc({ regression: 1 }), undefined, { timeZone: 'UTC', fixesEnabled: false })
    expect(text).toContain('Something in your app is failing.')
    expect(text).toContain('it’s back')
    expect(text).toContain('"ignore"')
  })
})
