// Onboarding copy: the connect prompt (pasted into the founder's coding agent) and the phone link (QR on the site).
import { config } from './config.js'

/**
 * Short on purpose: the skill holds the instructions, scripts and reporter templates.
 * Carries only a single-use claim code, never the ingest secret.
 */
export function connectPrompt(claimToken: string): string {
  const api = config.PUBLIC_URL
  return `Connect this project to Patchline (it texts me on iMessage when my app breaks).

1. Run: npx skills add ${config.SKILLS_SOURCE} --skill patchline
2. Read the installed patchline SKILL.md completely and follow it.
   If step 1 fails, download ${api}/skill/SKILL.md and follow that instead.

Claim code: ${claimToken}
Patchline API: ${api}`
}

/** Splits Keiki's join link (`sms:<number>?body=<join message>`) into its number and message. */
export function parseSmsLink(link: string | undefined): { number: string; body: string | undefined } | undefined {
  const m = link?.match(/^sms:([+\d]+)(?:[?&]body=(.*))?$/)
  if (!m) return undefined
  return { number: m[1]!, body: m[2] ? decodeURIComponent(m[2]).trim() || undefined : undefined }
}

// The first text has two jobs: join the Keiki agent (Keiki's join message, e.g. "Hi! (K-D4ZH9B)") and link the
// phone ("start 123456"). Explicit KEIKI_SMS_NUMBER / KEIKI_JOIN_CODE win; otherwise both come from the join link.
const joinSms = parseSmsLink(config.KEIKI_JOIN_LINK)
const smsNumber = config.KEIKI_SMS_NUMBER ?? joinSms?.number
const joinPrefix = config.KEIKI_JOIN_CODE ?? joinSms?.body

/** What the owner texts to link their phone, e.g. "Hi! (K-D4ZH9B) start 123456". */
export const startText = (code: string) => `${joinPrefix ? `${joinPrefix} ` : ''}start ${code}`

/** `sms:` link that opens Messages with the text pre-filled (rendered as a QR code on desktop). */
export const smsLink = (code: string) =>
  smsNumber ? `sms:${smsNumber}?body=${encodeURIComponent(startText(code))}` : null

/** The agent's number, shown on the site for people who type the text themselves. */
export const smsDisplayNumber = smsNumber ?? null
