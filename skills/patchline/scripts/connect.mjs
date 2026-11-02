#!/usr/bin/env node
// Exchanges a single-use Patchline claim code for the ingest URL and writes it into the app's env file.
// Prints JSON without the secret. Node 18+, no dependencies.
// Usage: node connect.mjs --claim pl_claim_… --api https://… [--dir .] [--origins https://a.com,https://b.com] [--name my-app] [--env-file .env]
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
)
const out = (o, code = 0) => {
  console.log(JSON.stringify(o, null, 2))
  process.exit(code)
}

if (!args.claim?.startsWith('pl_claim_') || !args.api) out({ ok: false, error: 'usage: --claim pl_claim_… --api https://…' }, 1)

const dir = resolve(args.dir ?? '.')
const pkgPath = join(dir, 'package.json')
const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : {}
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const isNext = 'next' in deps
const envFile = args['env-file'] ?? (isNext ? '.env.local' : '.env')
const appName = (args.name ?? pkg.name ?? basename(dir)).replace(/^@[^/]+\//, '').slice(0, 60)
const allowedOrigins = args.origins ? args.origins.split(',').map((s) => s.trim()).filter(Boolean) : []

let res
try {
  res = await fetch(`${args.api.replace(/\/$/, '')}/api/claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: args.claim, appName, allowedOrigins }),
    signal: AbortSignal.timeout(15000),
  })
} catch (err) {
  out({ ok: false, error: `cannot reach Patchline API: ${err.message}` }, 1)
}
const body = await res.json().catch(() => ({}))
if (!res.ok) out({ ok: false, status: res.status, error: body.error ?? 'claim failed' }, 1)

function upsertEnv(file, key, value) {
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : []
  const i = lines.findIndex((l) => l.startsWith(`${key}=`))
  if (i >= 0) lines[i] = `${key}=${value}`
  else {
    if (lines.length && lines[lines.length - 1] !== '') lines.push('')
    lines.push(`${key}=${value}`)
  }
  writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'))
}

function ensureLine(file, line) {
  const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  if (text.split(/\r?\n/).some((l) => l.trim() === line)) return false
  writeFileSync(file, `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`)
  return true
}

const vars = ['PATCHLINE_URL']
upsertEnv(join(dir, envFile), 'PATCHLINE_URL', body.ingestUrl)
if (body.publicIngestUrl) {
  const publicVar = isNext ? 'NEXT_PUBLIC_PATCHLINE_URL' : 'PATCHLINE_PUBLIC_URL'
  upsertEnv(join(dir, envFile), publicVar, body.publicIngestUrl)
  vars.push(publicVar)
}
for (const v of vars) ensureLine(join(dir, '.env.example'), `${v}=`)

// Make sure the env file can't be committed. Covers the common patterns (incl. Next.js's default `.env*.local`).
const covers = (p, f) =>
  p === f || p === `/${f}` || p === '.env*' || (p === '.env.*' && f !== '.env') || (p === '.env*.local' && f.endsWith('.local'))
const gitignore = join(dir, '.gitignore')
const giLines = existsSync(gitignore) ? readFileSync(gitignore, 'utf8').split(/\r?\n/).map((l) => l.trim()) : []
if (!giLines.some((l) => covers(l, envFile))) ensureLine(gitignore, envFile)

out({
  ok: true,
  app: body.app,
  envFile,
  wrote: vars,
  framework: isNext ? 'next' : (['express', 'hono', 'fastify', '@nestjs/core'].find((d) => d in deps) ?? 'node'),
  typescript: 'typescript' in deps || existsSync(join(dir, 'tsconfig.json')),
  phoneConnected: body.phoneConnected,
  phone: body.phone ? { text: body.phone.text, smsLink: body.phone.smsLink } : null,
  note: 'Secret written to the env file. Do not print it.',
})
