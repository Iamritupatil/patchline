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

/** What the owner texts to link their phone. Prefixed with the Keiki join code on a shared number. */
export const startText = (code: string) => `${config.KEIKI_JOIN_CODE ? `${config.KEIKI_JOIN_CODE} ` : ''}start ${code}`

/** `sms:` link that opens Messages with the text pre-filled (rendered as a QR code on desktop). */
export const smsLink = (code: string) =>
  config.KEIKI_SMS_NUMBER ? `sms:${config.KEIKI_SMS_NUMBER}&body=${encodeURIComponent(startText(code))}` : null
