// Sends a sample alert built with the real template, so the phone shows exactly what production sends.
// Text the agent once first (users must start the conversation). Usage: npm run keiki:notice -- +14155550123
import { topFrame } from '../src/group.js'
import type { Incident } from '../src/incidents.js'
import { sendNotice } from '../src/keiki/notify.js'
import { alertText } from '../src/messages.js'
import { normalizePhone, timeZoneForPhone } from '../src/tenants.js'

const phone = normalizePhone(process.argv[2] ?? '')
if (!phone) throw new Error('usage: npm run keiki:notice -- +<phone>')

const stack = "TypeError: Cannot read properties of undefined (reading 'secret')\n    at verifyWebhook (/app/server/src/billing.ts:42:31)"
const now = Date.now()
const incident: Incident = {
  id: 7,
  tenant_id: 'demo',
  fingerprint: 'demo',
  kind: 'bug',
  status: 'open',
  service: 'notchman-api',
  title: "TypeError: Cannot read properties of undefined (reading 'secret')",
  sample: JSON.stringify({ message: 'TypeError', stack, level: 'error' }),
  regression: 0,
  count: 12,
  first_seen: now - 6 * 60 * 1000,
  last_seen: now,
  diagnosis: null,
}

const text = alertText(incident, topFrame(stack), { timeZone: timeZoneForPhone(phone) ?? 'UTC', fixesEnabled: true })
const started = Date.now()
console.log('result:', await sendNotice(phone, text), `${Date.now() - started}ms`)
console.log('Sent:\n' + text)
