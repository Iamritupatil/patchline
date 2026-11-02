import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

export const newToken = (prefix: string, bytes = 24) => `${prefix}${randomBytes(bytes).toString('base64url')}`

export const newId = () => randomBytes(8).toString('hex')

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export const hmacHex = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex')

export const sixDigitCode = () => randomInt(0, 1_000_000).toString().padStart(6, '0')

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}
