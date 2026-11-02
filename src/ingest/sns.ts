import { createVerify } from 'node:crypto'
import { z } from 'zod'
import { log } from '../log.js'
import { AlertEvent, IngestError, clip, toLevel } from './types.js'

export const SnsMessage = z.object({
  Type: z.enum(['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation']),
  MessageId: z.string(),
  TopicArn: z.string(),
  Message: z.string(),
  Timestamp: z.string(),
  SignatureVersion: z.enum(['1', '2']),
  Signature: z.string(),
  SigningCertURL: z.url(),
  Subject: z.string().optional(),
  SubscribeURL: z.url().optional(),
  Token: z.string().optional(),
})
export type SnsMessage = z.infer<typeof SnsMessage>

const AWS_SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/

const SIGNED_KEYS: Record<SnsMessage['Type'], (keyof SnsMessage)[]> = {
  Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
  SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
  UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
}

export function stringToSign(m: SnsMessage): string {
  return SIGNED_KEYS[m.Type]
    .filter((k) => m[k] !== undefined)
    .map((k) => `${k}\n${m[k]}\n`)
    .join('')
}

/** Only ever fetch from AWS SNS hosts over HTTPS (prevents SSRF via forged cert/subscribe URLs). */
export function isAwsSnsUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && AWS_SNS_HOST.test(u.hostname)
  } catch {
    return false
  }
}

const certCache = new Map<string, string>()

export async function verifySns(m: SnsMessage, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!isAwsSnsUrl(m.SigningCertURL) || !new URL(m.SigningCertURL).pathname.endsWith('.pem')) return false
  let pem = certCache.get(m.SigningCertURL)
  if (!pem) {
    const res = await fetchImpl(m.SigningCertURL, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return false
    pem = await res.text()
    certCache.set(m.SigningCertURL, pem)
  }
  const verifier = createVerify(m.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256')
  verifier.update(stringToSign(m))
  try {
    return verifier.verify(pem, m.Signature, 'base64')
  } catch {
    return false
  }
}

export async function confirmSubscription(m: SnsMessage, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (!m.SubscribeURL || !isAwsSnsUrl(m.SubscribeURL)) throw new IngestError('bad SubscribeURL', 403)
  const res = await fetchImpl(m.SubscribeURL, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`SNS confirm failed: ${res.status}`)
  log.info('sns subscription confirmed', { topic: m.TopicArn })
}

const CloudWatchAlarm = z.object({
  AlarmName: z.string(),
  NewStateValue: z.string(),
  NewStateReason: z.string().optional(),
  AlarmDescription: z.string().nullish(),
})

const AppAlert = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
  service: z.string().optional(),
  level: z.string().optional(),
  stack: z.string().optional(),
  count: z.coerce.number().int().positive().optional(),
  url: z.string().optional(),
})

/** Notification `Message` is a CloudWatch alarm, an app alert JSON, or plain text. */
export function parseSnsNotification(m: SnsMessage): AlertEvent {
  let inner: unknown
  try {
    inner = JSON.parse(m.Message)
  } catch {
    inner = undefined
  }

  const alarm = CloudWatchAlarm.safeParse(inner)
  if (alarm.success) {
    const a = alarm.data
    const level = a.NewStateValue === 'ALARM' ? 'error' : a.NewStateValue === 'OK' ? 'info' : 'warning'
    const reason = a.NewStateValue === 'OK' ? 'recovered' : (a.NewStateReason ?? a.AlarmDescription ?? 'alarm')
    return AlertEvent.parse({
      source: 'sns',
      sourceId: m.MessageId,
      service: clip(a.AlarmName, 100),
      level,
      message: clip(`${a.AlarmName}: ${reason}`, 4000),
    })
  }

  const app = AppAlert.safeParse(inner)
  const body = app.success ? app.data : {}
  const text = body.message ?? body.error ?? (inner === undefined ? m.Message : (m.Subject ?? m.Message))
  return AlertEvent.parse({
    source: 'sns',
    sourceId: m.MessageId,
    service: clip(body.service || m.TopicArn.split(':').pop() || 'app', 100),
    level: toLevel(body.level),
    message: clip(text || 'SNS alert', 4000),
    stack: clip(body.stack, 16000),
    count: body.count ?? 1,
    url: clip(body.url, 2000),
  })
}
