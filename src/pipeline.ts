import { classify, fingerprint, TERMINAL, topFrame } from './group.js'
import { bumpIncident, createIncident, isMuted, latestByFingerprint } from './incidents.js'
import type { AlertEvent } from './ingest/types.js'
import { notifyOwners } from './keiki/notify.js'
import { errMsg, log } from './log.js'
import { alertText, infoText, testEventText } from './messages.js'
import { scrubDeep } from './scrub.js'
import { markSeen } from './store.js'
import { tenantById, touchLastEvent, type Tenant } from './tenants.js'

// One queue per tenant: events for a tenant are processed in order, tenants run in parallel.
const queues = new Map<string, Promise<void>>()

export function enqueue(tenantId: string, event: AlertEvent): void {
  const prev = queues.get(tenantId) ?? Promise.resolve()
  const next = prev
    .then(() => processEvent(tenantId, event))
    .catch((err) => log.error('pipeline failed', { tenantId, err: errMsg(err) }))
  queues.set(tenantId, next)
  void next.finally(() => {
    if (queues.get(tenantId) === next) queues.delete(tenantId)
  })
}

/** Resolves once every queued event has been processed (tests, graceful shutdown). */
export async function drain(): Promise<void> {
  while (queues.size) await Promise.all(queues.values())
}

// Triage + A/B fixes (Book 3) plug in after the first text.
const fixesEnabled = (t: Tenant) => !!t.repo && !!t.github_installation_id

export async function processEvent(tenantId: string, raw: AlertEvent): Promise<void> {
  const tenant = await tenantById(tenantId)
  if (!tenant) return
  const event = scrubDeep(raw)
  await touchLastEvent(tenantId)

  if (event.sourceId && !(await markSeen(`ev:${tenantId}:${event.source}:${event.sourceId}`))) return

  if (event.source === 'test') {
    await notifyOwners(tenantId, testEventText(tenant.name))
    return
  }

  const fp = fingerprint(event)
  if (await isMuted(tenantId, fp)) return

  const now = Date.now()
  const existing = await latestByFingerprint(tenantId, fp)
  if (existing && !TERMINAL.has(existing.status)) {
    await bumpIncident(existing.id, event.count, now)
    return
  }

  const kind = classify(event)
  const incident = await createIncident({
    tenantId,
    fingerprint: fp,
    kind,
    event,
    regression: existing?.status === 'shipped',
    now,
  })
  log.info('incident opened', { tenantId, id: incident.id, kind, service: incident.service })

  const text =
    kind === 'bug'
      ? alertText(incident, topFrame(event.stack), { timeZone: tenant.timezone, fixesEnabled: fixesEnabled(tenant) })
      : infoText(incident)
  await notifyOwners(tenantId, text)
}
