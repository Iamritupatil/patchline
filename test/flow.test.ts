import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { hmacHex } from '../src/crypto.js'
import { drain } from '../src/pipeline.js'
import { all, migrate } from '../src/store.js'

const PHONE = '+14155550123'

async function tool(name: string, input: Record<string, unknown>, phone = PHONE) {
  const body = JSON.stringify({ input, context: { phone } })
  const ts = `${Math.floor(Date.now() / 1000)}`
  const res = await app.request(`/keiki/tools/${name}`, {
    method: 'POST',
    headers: { 'x-keiki-signature': `sha256=${hmacHex('test-secret', `${ts}.${body}`)}`, 'x-keiki-timestamp': ts },
    body,
  })
  return { status: res.status, ...((await res.json()) as { ok: boolean; message: string }) }
}

const send = (key: string, body: unknown, headers: Record<string, string> = {}) =>
  app.request(`/ingest/${key}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

type Signup = { sessionToken: string; publicKey: string; phone: { code: string; text: string }; connect: { prompt: string } }
let signup: Signup & { ingestKey: string; onboarding: { code: string } }

const json = (body: unknown) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const claimCode = (prompt: string) => /pl_claim_[\w-]+/.exec(prompt)![0]

async function signupAndClaim(appName: string, allowedOrigins: string[] = []) {
  const res = await app.request('/api/signup', json({}))
  expect(res.status).toBe(201)
  const s = (await res.json()) as Signup
  expect(s.connect.prompt).not.toContain('pl_sk_')
  const claim = await app.request('/api/claim', json({ token: claimCode(s.connect.prompt), appName, allowedOrigins }))
  expect(claim.status).toBe(200)
  const c = (await claim.json()) as { ingestUrl: string; app: string }
  expect(c.app).toBe(appName)
  return { ...s, ingestKey: c.ingestUrl.split('/ingest/')[1]!, onboarding: { code: s.phone.code } }
}

beforeAll(async () => {
  await migrate()
  signup = await signupAndClaim('myapp', ['https://myapp.com/'])
})

describe('claim', () => {
  it('is single use', async () => {
    const res = await app.request('/api/signup', json({}))
    const s = (await res.json()) as Signup
    const token = claimCode(s.connect.prompt)
    expect((await app.request('/api/claim', json({ token }))).status).toBe(200)
    expect((await app.request('/api/claim', json({ token }))).status).toBe(404)
    expect((await app.request('/api/claim', json({ token: 'pl_claim_nope' }))).status).toBe(404)
  })
})

describe('onboarding', () => {
  it('rejects unsigned tool calls', async () => {
    const res = await app.request('/keiki/tools/start', { method: 'POST', body: '{}' })
    expect(res.status).toBe(401)
  })

  it('refuses owner tools for unknown phones', async () => {
    expect((await tool('list_incidents', {})).message).toBe('not_authorized')
  })

  it('binds the phone with the one-time code', async () => {
    const wrong = signup.onboarding.code === '000000' ? '111111' : '000000'
    expect((await tool('start', { code: wrong })).ok).toBe(false)
    const ok = await tool('start', { code: signup.onboarding.code })
    expect(ok.ok).toBe(true)
    expect(ok.message).toContain('myapp')
    expect((await tool('start', { code: signup.onboarding.code }, '+14155550999')).ok).toBe(false)
  })

  it('shows status to the dashboard session only', async () => {
    expect((await app.request('/api/me/status')).status).toBe(401)
    const res = await app.request('/api/me/status', { headers: { authorization: `Bearer ${signup.sessionToken}` } })
    expect(await res.json()).toMatchObject({ name: 'myapp', phoneConnected: true, owners: ['…0123'] })
  })
})

describe('ingest → incident', () => {
  it('rejects unknown keys and bad bodies', async () => {
    expect((await send('pl_sk_nope', { message: 'x' })).status).toBe(404)
    expect((await send(signup.ingestKey, { level: 'error' })).status).toBe(400)
  })

  it('opens one incident per bug and groups repeats', async () => {
    const event = {
      service: 'api',
      level: 'error',
      message: 'TypeError: user 42 is undefined for jane@acme.io',
      stack: 'at charge (src/billing.ts:42:13)',
    }
    expect((await send(signup.ingestKey, event)).status).toBe(202)
    expect((await send(signup.ingestKey, { ...event, message: 'TypeError: user 7 is undefined for bob@acme.io' })).status).toBe(202)
    await drain()

    const rows = await all<{ count: number; sample: string; status: string }>('SELECT count, sample, status FROM incidents')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.count).toBe(2)
    expect(rows[0]!.sample).not.toContain('@acme.io')
  })

  it('dedupes by source id', async () => {
    const event = { id: 'evt-1', service: 'worker', level: 'error', message: 'queue stalled' }
    await send(signup.ingestKey, event)
    await send(signup.ingestKey, event)
    await drain()
    const rows = await all<{ count: number }>("SELECT count FROM incidents WHERE service = 'worker'")
    expect(rows).toEqual([{ count: 1 }])
  })

  it('public key only works from allowed origins', async () => {
    const event = { service: 'web', level: 'error', message: 'ReferenceError: foo is not defined' }
    expect((await send(signup.publicKey, event)).status).toBe(403)
    expect((await send(signup.publicKey, event, { origin: 'https://evil.io' })).status).toBe(403)
    expect((await send(signup.publicKey, event, { origin: 'https://myapp.com' })).status).toBe(202)
    expect((await send(signup.publicKey, event, { origin: 'https://myapp.com', 'x-amz-sns-message-type': 'Notification' })).status).toBe(403)
  })
})

describe('owner tools', () => {
  it('lists and ignores incidents; ignored fingerprints stay muted', async () => {
    const list = await tool('list_incidents', {})
    expect(list.message).toContain('api')

    const [inc] = await all<{ id: number }>("SELECT id FROM incidents WHERE service = 'api'")
    const ignored = await tool('ignore', { id: inc!.id })
    expect(ignored.message).toContain(`Muted #${inc!.id}`)

    await send(signup.ingestKey, { service: 'api', level: 'error', message: 'TypeError: user 1 is undefined for x@y.io', stack: 'at charge (src/billing.ts:50:1)' })
    await drain()
    const rows = await all<{ id: number }>("SELECT id FROM incidents WHERE service = 'api'")
    expect(rows).toHaveLength(1)
  })

  it('cannot read another tenant’s incident by id', async () => {
    const o = await signupAndClaim('other')
    await send(o.ingestKey, { service: 'secret-svc', level: 'error', message: 'private failure' })
    await drain()
    const [inc] = await all<{ id: number }>("SELECT id FROM incidents WHERE service = 'secret-svc'")
    const res = await tool('get_incident', { id: inc!.id })
    expect(res.ok).toBe(false)
    expect(res.message).not.toContain('private failure')
  })
})
