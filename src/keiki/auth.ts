import { hmacHex, safeEqual } from '../crypto.js'

const MAX_SKEW_S = 300

/**
 * Keiki signs webhooks with HMAC-SHA256 over `<timestamp>.<raw body>`, in one of two documented header styles:
 *   X-Keiki-Signature: sha256=<hex>  +  X-Keiki-Timestamp: <ts>
 *   Keiki-Signature: t=<ts>,v1=<hex>
 * Tool-call headers are not documented explicitly, so both are accepted. Verify with KEIKI_DEBUG during the spike.
 */
export function verifyKeiki(
  header: (name: string) => string | undefined,
  rawBody: string,
  secret: string,
  nowS = Math.floor(Date.now() / 1000),
): boolean {
  return verifiedTimestamp(header, rawBody, secret, nowS) !== undefined
}

/** The exact timestamp the signature covered, or undefined if it doesn't verify. Use this for replay keys. */
export function verifiedTimestamp(
  header: (name: string) => string | undefined,
  rawBody: string,
  secret: string,
  nowS = Math.floor(Date.now() / 1000),
): string | undefined {
  let ts: string | undefined
  let sig: string | undefined

  const xSig = header('x-keiki-signature')
  if (xSig) {
    ts = header('x-keiki-timestamp')
    sig = xSig.replace(/^sha256=/, '')
  } else {
    const parts = Object.fromEntries(
      (header('keiki-signature') ?? '').split(',').map((p) => p.trim().split('=', 2) as [string, string]),
    )
    ts = parts.t
    sig = parts.v1
  }
  if (!ts || !sig || !/^\d+$/.test(ts)) return undefined

  const tsS = ts.length > 11 ? Math.floor(Number(ts) / 1000) : Number(ts)
  if (Math.abs(nowS - tsS) > MAX_SKEW_S) return undefined

  return safeEqual(hmacHex(secret, `${ts}.${rawBody}`), sig.toLowerCase()) ? ts : undefined
}
