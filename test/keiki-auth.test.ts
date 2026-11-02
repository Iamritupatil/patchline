import { describe, expect, it } from 'vitest'
import { hmacHex } from '../src/crypto.js'
import { verifyKeiki } from '../src/keiki/auth.js'

const secret = 's3cret'
const body = '{"input":{},"context":{"phone":"+14155550123"}}'
const now = 1_800_000_000
const sig = hmacHex(secret, `${now}.${body}`)
const headers = (h: Record<string, string>) => (n: string) => h[n]

describe('verifyKeiki', () => {
  it('accepts X-Keiki-Signature style', () => {
    expect(verifyKeiki(headers({ 'x-keiki-signature': `sha256=${sig}`, 'x-keiki-timestamp': `${now}` }), body, secret, now)).toBe(true)
  })

  it('accepts Keiki-Signature t=,v1= style', () => {
    expect(verifyKeiki(headers({ 'keiki-signature': `t=${now},v1=${sig}` }), body, secret, now)).toBe(true)
  })

  it('rejects tampered body, wrong secret, stale timestamp, missing header', () => {
    const h = headers({ 'keiki-signature': `t=${now},v1=${sig}` })
    expect(verifyKeiki(h, body + ' ', secret, now)).toBe(false)
    expect(verifyKeiki(h, body, 'other', now)).toBe(false)
    expect(verifyKeiki(h, body, secret, now + 301)).toBe(false)
    expect(verifyKeiki(headers({}), body, secret, now)).toBe(false)
  })
})
