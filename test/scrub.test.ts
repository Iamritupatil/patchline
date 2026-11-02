import { describe, expect, it } from 'vitest'
import { scrub, scrubDeep } from '../src/scrub.js'

// Fake secrets are assembled at runtime so no secret-looking literal lives in the repo.
const fakeGithub = 'gh' + 'p_' + 'a1'.repeat(18)
const fakeStripe = 'sk' + '_live_' + 'Ab12'.repeat(5)
const fakeDbUrl = ['postgres://admin', 'hunter22@db.internal/app'].join(':')

describe('scrub', () => {
  it.each([
    ['user jane.doe@acme.io failed', 'user [EMAIL] failed'],
    ['id 3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b', 'id [UUID]'],
    ['from 192.168.1.20', 'from [IP]'],
    ['card 4242 4242 4242 4242', 'card [CARD]'],
    ['customer cus_N1a2B3c4D5e6 charged', 'customer [ID] charged'],
    [`key ${fakeStripe}`, 'key [TOKEN]'],
    [`token ${fakeGithub}`, 'token [TOKEN]'],
    ['call +14155550123 now', 'call [PHONE] now'],
    [fakeDbUrl, 'postgres://[CREDS]@db.internal/app'],
    ['password=hunter2&next=1', 'password=[SECRET]&next=1'],
    ['{"api_key": "abc123xyz"}', '{"api_key": "[SECRET]"}'],
  ])('%s', (input, expected) => {
    expect(scrub(input)).toBe(expected)
  })

  it('masks bearer tokens and JWTs', () => {
    expect(scrub('Bearer abc.def.ghi123')).toBe('Bearer [TOKEN]')
    expect(scrub('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig_part')).toBe('jwt [JWT]')
  })

  it('keeps stack frames and ordinary numbers', () => {
    const s = 'TypeError: x is undefined\n    at handler (src/billing.ts:42:13)'
    expect(scrub(s)).toBe(s)
    expect(scrub('retried 3 times in 1500ms')).toBe('retried 3 times in 1500ms')
  })

  it('does not mask non-Luhn long numbers as cards', () => {
    expect(scrub('order 1234567890123')).toBe('order 1234567890123')
  })

  it('scrubs nested objects', () => {
    expect(scrubDeep({ a: ['x@y.com'], b: { c: 'ok', n: 5 } })).toEqual({ a: ['[EMAIL]'], b: { c: 'ok', n: 5 } })
  })
})
