import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { api } from './api.js'
import { config } from './config.js'
import { safeEqual } from './crypto.js'
import { ingest } from './ingest/route.js'
import { keikiTools } from './keiki/tools.js'
import { errMsg, log } from './log.js'
import { skill } from './skill.js'

export const app = new Hono()

// Cap bodies before anything reads them (the Keiki route reads the body before its signature check).
const limit = (kb: number) => bodyLimit({ maxSize: kb * 1024, onError: (c) => c.json({ error: 'too_large' }, 413) })
app.use('/ingest/*', limit(256))
app.use('/keiki/tools/*', limit(64))
app.use('/api/*', limit(64))

app.get('/health', (c) => c.json({ ok: true }))

// Maritime agent contract: POST /chat must answer within 30s. Owners talk to Patchline over iMessage, not here.
app.post('/chat', (c) =>
  c.json({ response: 'Patchline is running. Owners talk to it over iMessage; apps send errors to /ingest.' }),
)
app.route('/ingest', ingest)
app.route('/keiki/tools', keikiTools)
app.route('/api', api)
app.route('/skill', skill)

// Spike: does Maritime keep the process running after the HTTP response? Watch `maritime logs -f`.
app.post('/admin/spike/background', (c) => {
  const token = c.req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!config.ADMIN_TOKEN || !safeEqual(token, config.ADMIN_TOKEN)) return c.json({ error: 'unauthorized' }, 401)
  const seconds = Math.min(Number(c.req.query('seconds') ?? 180), 600)
  const started = Date.now()
  const timer = setInterval(() => {
    const elapsed = Math.round((Date.now() - started) / 1000)
    log.info('spike heartbeat', { elapsed })
    if (elapsed >= seconds) clearInterval(timer)
  }, 15_000)
  return c.json({ ok: true, seconds })
})

app.notFound((c) => c.json({ error: 'not_found' }, 404))
app.onError((err, c) => {
  log.error('unhandled', { path: c.req.path, err: errMsg(err) })
  return c.json({ error: 'internal' }, 500)
})
