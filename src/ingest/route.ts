import { Hono } from 'hono'
import { errMsg, log } from '../log.js'
import { enqueue } from '../pipeline.js'
import { allow } from '../ratelimit.js'
import { origins, tenantByIngestKey } from '../tenants.js'
import { parseGeneric } from './generic.js'
import { SnsMessage, confirmSubscription, parseSnsNotification, verifySns } from './sns.js'
import { IngestError } from './types.js'

const MAX_BODY = 256 * 1024

export const ingest = new Hono()

// Browser reporters send text/plain (no preflight); this answers preflight for fetch() with JSON anyway.
ingest.options('/:key', async (c) => {
  const found = await tenantByIngestKey(c.req.param('key'))
  const origin = c.req.header('origin')
  if (found?.kind !== 'public' || !origin || !origins(found.tenant).includes(origin)) return c.body(null, 403)
  c.header('access-control-allow-origin', origin)
  c.header('access-control-allow-methods', 'POST')
  c.header('access-control-allow-headers', 'content-type')
  c.header('access-control-max-age', '600')
  return c.body(null, 204)
})

ingest.post('/:key', async (c) => {
  const key = c.req.param('key')
  if (!allow(`ingest:${key}`, 120, 60_000)) return c.json({ error: 'rate_limited' }, 429)

  const found = await tenantByIngestKey(key)
  if (!found) return c.json({ error: 'unknown_key' }, 404)
  const { tenant, kind } = found

  if (kind === 'public') {
    const origin = c.req.header('origin')
    if (!origin || !origins(tenant).includes(origin)) return c.json({ error: 'origin_not_allowed' }, 403)
    c.header('access-control-allow-origin', origin)
  }

  const raw = await c.req.text()
  if (raw.length > MAX_BODY) return c.json({ error: 'too_large' }, 413)

  try {
    const body: unknown = JSON.parse(raw)
    const snsType = c.req.header('x-amz-sns-message-type')

    if (snsType) {
      if (kind !== 'server') throw new IngestError('SNS requires the server key', 403)
      const msg = SnsMessage.parse(body)
      if (!(await verifySns(msg))) throw new IngestError('bad SNS signature', 403)
      if (msg.Type === 'SubscriptionConfirmation') {
        await confirmSubscription(msg)
        return c.json({ ok: true, confirmed: true })
      }
      if (msg.Type === 'Notification') enqueue(tenant.id, parseSnsNotification(msg))
      return c.json({ ok: true }, 202)
    }

    enqueue(tenant.id, parseGeneric(body, kind === 'public' ? 'browser' : 'generic'))
    return c.json({ ok: true }, 202)
  } catch (err) {
    if (err instanceof IngestError) return c.json({ error: err.message }, err.status)
    if (err instanceof SyntaxError || (err as { name?: string }).name === 'ZodError') {
      return c.json({ error: 'invalid body' }, 400)
    }
    log.error('ingest failed', { tenantId: tenant.id, err: errMsg(err) })
    return c.json({ error: 'internal' }, 500)
  }
})
