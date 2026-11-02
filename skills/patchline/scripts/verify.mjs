#!/usr/bin/env node
// Sends a Patchline test event using PATCHLINE_URL from the app's env file (or the environment). Never prints the URL.
// Usage: node verify.mjs [--dir .] [--env-file .env]
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
)
const dir = resolve(args.dir ?? '.')
const out = (o, code = 0) => {
  console.log(JSON.stringify(o))
  process.exit(code)
}

const candidates = args['env-file'] ? [args['env-file']] : ['.env.local', '.env']
let url = process.env.PATCHLINE_URL
let source = 'environment'
for (const f of candidates) {
  if (url) break
  const p = join(dir, f)
  if (!existsSync(p)) continue
  const line = readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith('PATCHLINE_URL='))
  if (line) {
    url = line.slice('PATCHLINE_URL='.length).trim().replace(/^["']|["']$/g, '')
    source = f
  }
}
if (!url) out({ ok: false, error: 'PATCHLINE_URL not found. Run connect.mjs first (from the app folder).' }, 1)

const pkgPath = join(dir, 'package.json')
const service = existsSync(pkgPath) ? (JSON.parse(readFileSync(pkgPath, 'utf8')).name ?? 'app') : 'app'

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service, level: 'info', message: 'Patchline test', test: true }),
    signal: AbortSignal.timeout(10000),
  })
  out({ ok: res.ok, status: res.status, source }, res.ok ? 0 : 1)
} catch (err) {
  out({ ok: false, error: `cannot reach Patchline: ${err.message}`, source }, 1)
}
