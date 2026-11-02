// Serves the connect skill over HTTP: fallback when `npx skills add` is unavailable (see connectPrompt).
import { Hono } from 'hono'
import { readFileSync } from 'node:fs'

const FILES: Record<string, string> = {
  'SKILL.md': 'text/markdown; charset=utf-8',
  'scripts/connect.mjs': 'text/javascript; charset=utf-8',
  'scripts/verify.mjs': 'text/javascript; charset=utf-8',
  'templates/patchline.ts': 'text/plain; charset=utf-8',
  'templates/patchline.js': 'text/javascript; charset=utf-8',
}

const root = new URL('../skills/patchline/', import.meta.url)
const cache = new Map<string, string>()

export const skill = new Hono()

skill.get('/*', (c) => {
  const path = c.req.path.replace(/^\/skill\//, '')
  const type = FILES[path]
  if (!type) return c.json({ error: 'not_found' }, 404)
  let body = cache.get(path)
  if (body === undefined) {
    body = readFileSync(new URL(path, root), 'utf8')
    cache.set(path, body)
  }
  return c.body(body, 200, { 'content-type': type, 'cache-control': 'public, max-age=300' })
})
