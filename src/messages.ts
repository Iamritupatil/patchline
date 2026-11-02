// Text templates. Plain English first; technical detail only when the owner asks ("details").
import type { Frame } from './group.js'
import type { Incident } from './incidents.js'

type Sample = { message: string; stack?: string; url?: string; level?: string }

const clipLine = (s: string, max = 160) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

/** "2:04 PM", or "Nov 2, 2:04 PM" when it isn't from the last ~20 hours. */
export function friendlyTime(ms: number, timeZone: string, now = Date.now()): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone }
  if (now - ms > 20 * 60 * 60 * 1000) Object.assign(opts, { month: 'short', day: 'numeric' })
  return new Intl.DateTimeFormat('en-US', opts).format(ms)
}

const GENERIC_FILES = new Set(['index', 'main', 'app', 'server', 'handler', 'handlers', 'route', 'routes', 'page', 'api', 'utils', 'lib'])

const words = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .toLowerCase()
    .trim()

/** Best plain-English guess at *where* it broke, from the stack frame, then the URL. */
export function plainWhere(frame: Frame | undefined, url: string | undefined): string | undefined {
  const parts = frame?.file.replace(/\.[a-z]+$/i, '').split('/') ?? []
  const name = [...parts].reverse().find((p) => p && !GENERIC_FILES.has(p.toLowerCase()))
  if (name) return `The ${words(name)} part of your app`
  if (url) {
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    if (path && path !== '/') return `The ${path} page`
  }
  return undefined
}

export function alertText(inc: Incident, frame: Frame | undefined, opts: { timeZone: string; fixesEnabled: boolean }): string {
  const sample = JSON.parse(inc.sample) as Sample
  const where = plainWhere(frame, sample.url)
  const verb = sample.level === 'fatal' ? 'crashed' : 'is failing'
  const lines = [
    `🔴 ${inc.service} has a problem`,
    where ? `${where} ${verb}.` : `Something in your app ${verb}.`,
    `Started ${friendlyTime(inc.first_seen, opts.timeZone)}${inc.count > 1 ? ` · ${inc.count} times so far` : ''}`,
  ]
  if (inc.regression) lines.push('This was fixed before, but it’s back.')
  lines.push(
    opts.fixesEnabled
      ? "I'm looking into it and will text you a fix to approve shortly."
      : 'Reply "details" for the technical info, or "ignore" to stop alerts about it.',
  )
  if (opts.fixesEnabled) lines.push('Reply "details" for the technical info.')
  return lines.join('\n')
}

export const infoText = (inc: Incident) => `ℹ️ ${inc.service}: ${clipLine(inc.title)}`

export const connectedText = (tenantName: string) =>
  `✅ You're connected to ${tenantName}. I'll text you here the moment something breaks, with a fix you can approve by replying.`

export const testEventText = (tenantName: string) => `✅ Test alert from ${tenantName} received. You're all set!`

/** Technical view, only on request. */
export function incidentDetail(inc: Incident, timeZone: string): string {
  const sample = JSON.parse(inc.sample) as Sample
  const lines = [
    `#${inc.id} · ${inc.service} · ${inc.status}${inc.regression ? ' · came back' : ''}`,
    `${inc.count} times · first ${friendlyTime(inc.first_seen, timeZone)} · last ${friendlyTime(inc.last_seen, timeZone)}`,
    `Error: ${clipLine(sample.message, 300)}`,
  ]
  if (sample.url) lines.push(`Page: ${sample.url}`)
  if (sample.stack) lines.push(sample.stack.split('\n').slice(0, 3).join('\n'))
  return lines.join('\n')
}

export const incidentLine = (inc: Incident) =>
  `${inc.kind === 'bug' ? '🔴' : 'ℹ️'} #${inc.id} ${inc.service}: ${clipLine(inc.title, 70)} (${inc.count}×)`
