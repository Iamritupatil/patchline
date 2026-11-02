import type { InValue } from '@libsql/client'
import type { AlertEvent } from './ingest/types.js'
import type { Kind } from './group.js'
import { all, one, run } from './store.js'

export type Status = 'open' | 'triaging' | 'diagnosed' | 'fixes_ready' | 'pr_open' | 'shipped' | 'ignored' | 'failed'

export type Incident = {
  id: number
  tenant_id: string
  fingerprint: string
  kind: Kind
  status: Status
  service: string
  title: string
  sample: string
  regression: number
  count: number
  first_seen: number
  last_seen: number
  diagnosis: string | null
}

export const latestByFingerprint = (tenantId: string, fp: string) =>
  one<Incident>('SELECT * FROM incidents WHERE tenant_id = ? AND fingerprint = ? ORDER BY id DESC LIMIT 1', [tenantId, fp])

export async function createIncident(input: {
  tenantId: string
  fingerprint: string
  kind: Kind
  event: AlertEvent
  regression: boolean
  now: number
}): Promise<Incident> {
  const { tenantId, fingerprint, kind, event, regression, now } = input
  const title = (event.message.split('\n')[0] ?? event.message).slice(0, 140)
  const res = await run(
    `INSERT INTO incidents (tenant_id, fingerprint, kind, status, service, title, sample, regression, count, first_seen, last_seen)
     VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    [tenantId, fingerprint, kind, event.service, title, JSON.stringify(event), regression ? 1 : 0, event.count, now, now],
  )
  return res.rows[0] as unknown as Incident
}

export const bumpIncident = (id: number, by: number, now: number) =>
  run('UPDATE incidents SET count = count + ?, last_seen = ? WHERE id = ?', [by, now, id])

export const setStatus = (id: number, status: Status) => run('UPDATE incidents SET status = ? WHERE id = ?', [status, id])

export const mute = (tenantId: string, fp: string) =>
  run('INSERT OR IGNORE INTO mutes (tenant_id, fingerprint) VALUES (?, ?)', [tenantId, fp])

export const isMuted = async (tenantId: string, fp: string) =>
  !!(await one('SELECT 1 FROM mutes WHERE tenant_id = ? AND fingerprint = ?', [tenantId, fp]))

export function listIncidents(tenantIds: string[], opts: { status?: Status[]; limit?: number } = {}) {
  if (tenantIds.length === 0) return Promise.resolve([] as Incident[])
  const args: InValue[] = [...tenantIds]
  let sql = `SELECT * FROM incidents WHERE tenant_id IN (${tenantIds.map(() => '?').join(',')})`
  if (opts.status?.length) {
    sql += ` AND status IN (${opts.status.map(() => '?').join(',')})`
    args.push(...opts.status)
  }
  sql += ' ORDER BY id DESC LIMIT ?'
  args.push(opts.limit ?? 20)
  return all<Incident>(sql, args)
}
