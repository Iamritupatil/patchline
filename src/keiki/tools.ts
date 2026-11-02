import { Hono } from 'hono'
import { z } from 'zod'
import { config, isProd } from '../config.js'
import { TERMINAL } from '../group.js'
import { listIncidents, mute, setStatus, type Incident, type Status } from '../incidents.js'
import { log } from '../log.js'
import { connectedText, incidentDetail, incidentLine } from '../messages.js'
import { allow } from '../ratelimit.js'
import { normalizePhone, redeemCode, tenantsForPhone, type Tenant } from '../tenants.js'
import { verifyKeiki } from './auth.js'

const ToolCall = z.object({
  input: z.record(z.string(), z.unknown()).default({}),
  context: z.object({ phone: z.string().min(5) }),
})

export type Reply = { ok: boolean; message: string }
type Owner = { phone: string; tenants: Tenant[] }
type OwnerTool = (input: Record<string, unknown>, owner: Owner) => Promise<Reply>

const OPEN: Status[] = ['open', 'triaging', 'diagnosed', 'fixes_ready', 'pr_open']
const IncidentRef = z.object({ id: z.coerce.number().int().positive().optional() })

/** Explicit #id (only if it belongs to this owner), else the latest incident in one of `statuses`. */
async function resolveIncident(owner: Owner, id: number | undefined, statuses: Status[]): Promise<Incident | undefined> {
  const ids = owner.tenants.map((t) => t.id)
  if (id) return (await listIncidents(ids, { limit: 200 })).find((i) => i.id === id)
  return (await listIncidents(ids, { status: statuses, limit: 1 }))[0]
}

const ownerTools: Record<string, OwnerTool> = {
  async list_incidents(input, owner) {
    const { status } = z.object({ status: z.enum(['open', 'all']).default('open') }).parse(input)
    const items = await listIncidents(
      owner.tenants.map((t) => t.id),
      { status: status === 'open' ? OPEN : undefined, limit: 10 },
    )
    return { ok: true, message: items.length ? items.map(incidentLine).join('\n') : 'Nothing open. All quiet ✅' }
  },

  async get_incident(input, owner) {
    const { id } = IncidentRef.parse(input)
    const inc = await resolveIncident(owner, id, OPEN)
    const tz = owner.tenants.find((t) => t.id === inc?.tenant_id)?.timezone ?? 'UTC'
    return inc ? { ok: true, message: incidentDetail(inc, tz) } : { ok: false, message: 'No matching incident.' }
  },

  async ignore(input, owner) {
    const { id } = IncidentRef.parse(input)
    const inc = await resolveIncident(owner, id, OPEN)
    if (!inc) return { ok: false, message: 'No open incident to ignore.' }
    if (TERMINAL.has(inc.status)) return { ok: true, message: `#${inc.id} is already ${inc.status}.` }
    await mute(inc.tenant_id, inc.fingerprint)
    await setStatus(inc.id, 'ignored')
    return { ok: true, message: `Muted #${inc.id}. I won't text about this error again.` }
  },
}

/** `start 123456`: the one tool open to unknown phones. Binds the phone as owner. */
async function start(input: Record<string, unknown>, phone: string): Promise<Reply> {
  if (!allow(`start:${phone}`, 5, 60 * 60 * 1000)) return { ok: false, message: 'Too many attempts. Try again in an hour.' }
  const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Send "start" followed by the 6-digit code from the Patchline site.' }
  const tenant = await redeemCode(parsed.data.code, phone)
  if (!tenant) return { ok: false, message: 'That code is wrong or expired. Get a new one on the Patchline site.' }
  log.info('owner connected', { tenantId: tenant.id })
  return { ok: true, message: connectedText(tenant.name) }
}

export const TOOL_NAMES = ['start', ...Object.keys(ownerTools)]

export const keikiTools = new Hono()

keikiTools.post('/:name', async (c) => {
  const raw = await c.req.text()
  const header = (n: string) => c.req.header(n)

  if (config.KEIKI_DEBUG && !isProd) {
    log.info('keiki tool call (debug)', { headers: Object.keys(c.req.header()), body: raw.slice(0, 2000) })
  }

  if (config.KEIKI_WEBHOOK_SECRET) {
    if (!verifyKeiki(header, raw, config.KEIKI_WEBHOOK_SECRET)) return c.json({ ok: false, message: 'bad signature' }, 401)
  } else if (isProd) {
    return c.json({ ok: false, message: 'not configured' }, 503)
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return c.json({ ok: false, message: 'invalid json' }, 400)
  }
  const call = ToolCall.safeParse(body)
  if (!call.success) return c.json({ ok: false, message: 'invalid tool call' }, 400)

  const phone = normalizePhone(call.data.context.phone)
  if (!phone) return c.json({ ok: false, message: 'invalid phone' }, 400)

  const name = c.req.param('name')
  if (name === 'start') return c.json(await start(call.data.input, phone))

  const tool = ownerTools[name]
  if (!tool) return c.json({ ok: false, message: 'unknown tool' }, 404)

  // ownerCheck: only phones that redeemed a code for a tenant can act on it. Others get nothing useful.
  const tenants = await tenantsForPhone(phone)
  if (tenants.length === 0) return c.json({ ok: false, message: 'not_authorized' })

  try {
    return c.json(await tool(call.data.input, { phone, tenants }))
  } catch (err) {
    if (err instanceof z.ZodError) return c.json({ ok: false, message: 'invalid input' }, 400)
    throw err
  }
})
