// Same as clicking "Connect" on the site: prints the phone step and saves the connect prompt.
// Usage: npm run connect
import { writeFileSync } from 'node:fs'
import { config } from '../src/config.js'

const res = await fetch(`${config.PUBLIC_URL}/api/signup`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
})
if (!res.ok) throw new Error(`signup failed: ${res.status} ${await res.text()}`)
const s = (await res.json()) as {
  tenantId: string
  sessionToken: string
  phone: { text: string; smsLink: string | null }
  connect: { prompt: string }
}

const file = `data/connect-${s.tenantId}.md`
writeFileSync(file, s.connect.prompt)
writeFileSync(`data/session-${s.tenantId}.txt`, s.sessionToken)

console.log(`\n1. From your iPhone, text Patchline:  ${s.phone.text}${s.phone.smsLink ? `\n   (or open ${s.phone.smsLink})` : ''}`)
console.log(`\n2. Paste this into Claude Code / Cursor inside your app's repo (single use, 30 min):\n\n${s.connect.prompt}\n`)
console.log(`(saved to ${file})`)
