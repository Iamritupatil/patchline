import { createSign, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { isAwsSnsUrl, parseSnsNotification, stringToSign, verifySns, type SnsMessage } from '../src/ingest/sns.js'

const base: SnsMessage = {
  Type: 'Notification',
  MessageId: 'm-1',
  TopicArn: 'arn:aws:sns:us-east-1:123:AlertTopic',
  Message: 'plain alert',
  Timestamp: '2026-11-02T10:00:00.000Z',
  SignatureVersion: '2',
  Signature: '',
  SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-abc.pem',
}

describe('SNS', () => {
  it('only trusts AWS SNS https hosts', () => {
    expect(isAwsSnsUrl('https://sns.us-east-1.amazonaws.com/x.pem')).toBe(true)
    expect(isAwsSnsUrl('http://sns.us-east-1.amazonaws.com/x.pem')).toBe(false)
    expect(isAwsSnsUrl('https://sns.us-east-1.amazonaws.com.evil.io/x.pem')).toBe(false)
    expect(isAwsSnsUrl('https://169.254.169.254/latest')).toBe(false)
  })

  it('verifies a correctly signed message and rejects a tampered one', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const signer = createSign('RSA-SHA256')
    signer.update(stringToSign(base))
    const msg = { ...base, Signature: signer.sign(privateKey, 'base64') }
    const fakeFetch = (async () => new Response(pem)) as unknown as typeof fetch

    expect(await verifySns(msg, fakeFetch)).toBe(true)
    expect(await verifySns({ ...msg, Message: 'tampered' }, fakeFetch)).toBe(false)
    expect(await verifySns({ ...msg, SigningCertURL: 'https://evil.io/x.pem' }, fakeFetch)).toBe(false)
  })

  it('parses CloudWatch alarms', () => {
    const ev = parseSnsNotification({
      ...base,
      Message: JSON.stringify({ AlarmName: 'api-5xx', NewStateValue: 'ALARM', NewStateReason: '5xx > 10' }),
    })
    expect(ev).toMatchObject({ source: 'sns', sourceId: 'm-1', service: 'api-5xx', level: 'error', message: 'api-5xx: 5xx > 10' })
  })

  it('parses app alert JSON and plain text', () => {
    expect(
      parseSnsNotification({ ...base, Message: JSON.stringify({ message: 'boom', service: 'server', stack: 'at x (a.ts:1:1)' }) }),
    ).toMatchObject({ service: 'server', message: 'boom', stack: 'at x (a.ts:1:1)' })
    expect(parseSnsNotification(base)).toMatchObject({ service: 'AlertTopic', message: 'plain alert' })
  })
})
