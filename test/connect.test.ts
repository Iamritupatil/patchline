import { describe, expect, it } from 'vitest'
import { parseSmsLink } from '../src/connect.js'

describe('parseSmsLink', () => {
  it("splits Keiki's join link into number and join message", () => {
    expect(parseSmsLink('sms:+17796251378?body=Hi!%20(K-D4ZH9B)')).toEqual({ number: '+17796251378', body: 'Hi! (K-D4ZH9B)' })
  })

  it('accepts the iOS &body= form and links without a body', () => {
    expect(parseSmsLink('sms:+14155550123&body=hello')).toEqual({ number: '+14155550123', body: 'hello' })
    expect(parseSmsLink('sms:+14155550123')).toEqual({ number: '+14155550123', body: undefined })
  })

  it('ignores anything that is not an sms: link', () => {
    expect(parseSmsLink('https://keiki.example/join/abc')).toBeUndefined()
    expect(parseSmsLink(undefined)).toBeUndefined()
  })
})
