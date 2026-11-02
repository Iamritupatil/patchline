// Dashboard + onboarding API. Dashboard auth: `Authorization: Bearer <session token>` from signup.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { config, corsOrigins } from './config.js'
import { connectPrompt, smsLink, startText } from './connect.js'
import { listIncidents } from './incidents.js'
import { log } from './log.js'
import { enqueue } from './pipeline.js'
import { allow } from './ratelimit.js'
import { maskPhone } from './scrub.js'
import {
  claimTenant,
  createTenant,
  newClaimToken,
  newOnboardingCode,
  origins,
  ownerPhones,
  rotateIngestKey,
  tenantBySession,
  type Tenant,
} from './tenants.js'

type Env = { Variables: { tenant: Tenant } }

const Origin = z.url().transform((u) => new URL(u).origin)

const Signup = z.object({
  name: z.string().trim().min(1).max(60).default('My app'),
  allowedOrigins: z.array(Origin).max(10).default([]),
  /** Browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`, so texts show the owner's local time. */
  timezone: z.string().max(64).optional(),
})

const Claim = z.object({
  token: z.string().startsWith('pl_claim_').max(100),
  appName: z.string().trim().max(60).optional(),
  allowedOrigins: z.array(Origin).max(10).default([]),
})

const clientIp = (h: (n: string) => string | undefined) =>
  h('x-forwarded-for')?.split(',')[0]?.trim() || h('x-real-ip') || 'unknown'

const ingestUrl = (key: string) => `${config.PUBLIC_URL}/ingest/${key}`

const phoneStep = (code: string, expiresAt: number) => ({
  code,
  expiresAt,
  text: startText(code),
  smsLink: smsLink(code),
  joinLink: config.KEIKI_JOIN_LINK ?? null,
})

export const api = new Hono<Env>()

api.use('*', cors({ origin: corsOrigins, allowHeaders: ['authorization', 'content-type'], maxAge: 600 }))

/** "Connect" button: no form. Returns the phone step (QR) and the connect prompt (copy button). */
api.post('/signup', async (c) => {
  if (!allow(`signup:${clientIp((n) => c.req.header(n))}`, 10, 60 * 60 * 1000)) return c.json({ error: 'rate_limited' }, 429)
  const parsed = Signup.safeParse((await c.req.json().catch(() => ({}))) ?? {})
  if (!parsed.success) return c.json({ error: 'invalid', issues: parsed.error.issues.map((i) => i.message) }, 400)

  const t = await createTenant(parsed.data.name, parsed.data.allowedOrigins, parsed.data.timezone)
  return c.json(
    {
      tenantId: t.id,
      sessionToken: t.sessionToken,
      publicKey: t.publicKey,
      phone: phoneStep(t.code, t.codeExpiresAt),
      connect: { prompt: connectPrompt(t.claimToken), expiresAt: t.claimExpiresAt },
    },
    201,
  )
})

/** Called by the skill's connect script. Single-use claim → ingest URL written straight into the app's env file. */
api.post('/claim', async (c) => {
  if (!allow(`claim:${clientIp((n) => c.req.header(n))}`, 20, 60 * 60 * 1000)) return c.json({ error: 'rate_limited' }, 429)
  const parsed = Claim.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'invalid' }, 400)

  const claimed = await claimTenant(parsed.data.token, parsed.data.appName, parsed.data.allowedOrigins)
  if (!claimed) return c.json({ error: 'claim code is invalid, used or expired. Get a new prompt on the Patchline site.' }, 404)
  const { tenant, ingestKey } = claimed
  log.info('tenant claimed', { tenantId: tenant.id })

  // Keep the code the site is already showing (QR); only issue a new one if it expired.
  const phoneConnected = (await ownerPhones(tenant.id)).length > 0
  const current =
    tenant.onboarding_code && (tenant.onboarding_expires ?? 0) > Date.now()
      ? { code: tenant.onboarding_code, expiresAt: tenant.onboarding_expires! }
      : undefined
  const phone = phoneConnected ? null : (current ?? (await newOnboardingCode(tenant.id)))
  return c.json({
    app: tenant.name,
    ingestUrl: ingestUrl(ingestKey),
    publicIngestUrl: origins(tenant).length ? ingestUrl(tenant.public_key) : null,
    phoneConnected,
    phone: phone && phoneStep(phone.code, phone.expiresAt),
  })
})

api.use('/me/*', async (c, next) => {
  const token = c.req.header('authorization')?.replace(/^Bearer\s+/i, '')
  const tenant = token ? await tenantBySession(token) : undefined
  if (!tenant) return c.json({ error: 'unauthorized' }, 401)
  c.set('tenant', tenant)
  await next()
})

/** Polled by the site (every ~2s during onboarding) to flip ✅ phone / ✅ first event live. */
api.get('/me/status', async (c) => {
  const t = c.get('tenant')
  const phones = await ownerPhones(t.id)
  return c.json({
    tenantId: t.id,
    name: t.name,
    phoneConnected: phones.length > 0,
    owners: phones.map(maskPhone),
    repo: t.repo,
    githubConnected: !!t.github_installation_id,
    publicKey: t.public_key,
    allowedOrigins: origins(t),
    timezone: t.timezone,
    lastEventAt: t.last_event_at,
  })
})

api.get('/me/incidents', async (c) => {
  const items = await listIncidents([c.get('tenant').id], { limit: 50 })
  return c.json({ incidents: items.map(({ sample: _s, fingerprint: _f, ...rest }) => rest) })
})

api.post('/me/onboarding-code', async (c) => {
  const { code, expiresAt } = await newOnboardingCode(c.get('tenant').id)
  return c.json(phoneStep(code, expiresAt))
})

/** Fresh connect prompt (claim codes are single-use and expire after 30 min). */
api.post('/me/connect-prompt', async (c) => {
  const { token, expiresAt } = await newClaimToken(c.get('tenant').id)
  return c.json({ prompt: connectPrompt(token), expiresAt })
})

/** Manual setup for people without a coding agent. Shows the secret once. */
api.post('/me/rotate-key', async (c) => {
  const key = await rotateIngestKey(c.get('tenant').id)
  return c.json({ ingestKey: key, ingestUrl: ingestUrl(key) })
})

api.post('/me/test-event', async (c) => {
  const t = c.get('tenant')
  if (!allow(`test:${t.id}`, 5, 60 * 1000)) return c.json({ error: 'rate_limited' }, 429)
  enqueue(t.id, { source: 'test', service: 'dashboard', level: 'info', message: 'Patchline test event', count: 1 })
  return c.json({ ok: true }, 202)
})
