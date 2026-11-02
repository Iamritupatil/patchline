import { newId, newToken, sha256, sixDigitCode } from './crypto.js'
import { all, one, run } from './store.js'

export type Tenant = {
  id: string
  name: string
  repo: string | null
  default_branch: string
  github_installation_id: number | null
  test_cmd: string
  test_dir: string
  public_key: string
  allowed_origins: string
  uptime_url: string | null
  timezone: string
  onboarding_code: string | null
  onboarding_expires: number | null
  last_event_at: number | null
  created_at: number
}

// Never select ingest_key_hash / session_hash into app code.
const COL_LIST = [
  'id', 'name', 'repo', 'default_branch', 'github_installation_id', 'test_cmd', 'test_dir', 'public_key',
  'allowed_origins', 'uptime_url', 'timezone', 'onboarding_code', 'onboarding_expires', 'last_event_at', 'created_at',
]
const COLS = COL_LIST.join(', ')

const CODE_TTL_MS = 15 * 60 * 1000

export const origins = (t: Tenant): string[] => JSON.parse(t.allowed_origins) as string[]

/** Keys are returned once. Only hashes of the ingest key and session token are stored. */
const CLAIM_TTL_MS = 30 * 60 * 1000

/**
 * Keys are returned once. Only hashes of the ingest key, session token and claim token are stored.
 * The claim token goes in the connect prompt; the skill exchanges it for the ingest URL (see claimTenant),
 * so the real secret never appears in a chat transcript.
 */
export async function createTenant(name: string, allowedOrigins: string[], timezone?: string) {
  const id = newId()
  const ingestKey = newToken('pl_sk_')
  const publicKey = newToken('pl_pk_', 16)
  const sessionToken = newToken('pl_sess_')
  const claimToken = newToken('pl_claim_', 12)
  const claimExpiresAt = Date.now() + CLAIM_TTL_MS
  const tz = timezone && isTimeZone(timezone) ? timezone : 'UTC'
  const { code, expiresAt } = await insertWithCode(async (c, exp) =>
    run(
      `INSERT INTO tenants (id, name, ingest_key_hash, public_key, allowed_origins, timezone, session_hash,
        onboarding_code, onboarding_expires, claim_hash, claim_expires, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, sha256(ingestKey), publicKey, JSON.stringify(allowedOrigins), tz, sha256(sessionToken),
        c, exp, sha256(claimToken), claimExpiresAt, Date.now(),
      ],
    ),
  )
  return { id, ingestKey, publicKey, sessionToken, claimToken, claimExpiresAt, code, codeExpiresAt: expiresAt }
}

/** Single use. Renames the tenant to the detected app name and issues a fresh ingest key. */
export async function claimTenant(token: string, appName: string | undefined, allowedOrigins: string[]) {
  const tenant = await one<Tenant>(`SELECT ${COLS} FROM tenants WHERE claim_hash = ? AND claim_expires > ?`, [
    sha256(token),
    Date.now(),
  ])
  if (!tenant) return undefined
  const res = await run('UPDATE tenants SET claim_hash = NULL, claim_expires = NULL WHERE id = ? AND claim_hash = ?', [
    tenant.id,
    sha256(token),
  ])
  if (res.rowsAffected !== 1) return undefined

  const merged = [...new Set([...origins(tenant), ...allowedOrigins])]
  const name = appName?.trim() || tenant.name
  await run('UPDATE tenants SET name = ?, allowed_origins = ? WHERE id = ?', [name, JSON.stringify(merged), tenant.id])
  const ingestKey = await rotateIngestKey(tenant.id)
  return { tenant: { ...tenant, name, allowed_origins: JSON.stringify(merged) }, ingestKey }
}

export async function newClaimToken(tenantId: string) {
  const token = newToken('pl_claim_', 12)
  const expiresAt = Date.now() + CLAIM_TTL_MS
  await run('UPDATE tenants SET claim_hash = ?, claim_expires = ? WHERE id = ?', [sha256(token), expiresAt, tenantId])
  return { token, expiresAt }
}

/** Retries on the (rare) collision with another tenant's active code. */
async function insertWithCode(write: (code: string, expiresAt: number) => Promise<unknown>) {
  for (let i = 0; i < 5; i++) {
    const code = sixDigitCode()
    const expiresAt = Date.now() + CODE_TTL_MS
    try {
      await write(code, expiresAt)
      return { code, expiresAt }
    } catch (err) {
      if (!String(err).includes('UNIQUE') || !String(err).includes('onboarding_code')) throw err
    }
  }
  throw new Error('could not allocate onboarding code')
}

export async function newOnboardingCode(tenantId: string) {
  return insertWithCode((c, exp) =>
    run('UPDATE tenants SET onboarding_code = ?, onboarding_expires = ? WHERE id = ?', [c, exp, tenantId]),
  )
}

export async function rotateIngestKey(tenantId: string): Promise<string> {
  const key = newToken('pl_sk_')
  await run('UPDATE tenants SET ingest_key_hash = ? WHERE id = ?', [sha256(key), tenantId])
  return key
}

export const tenantById = (id: string) => one<Tenant>(`SELECT ${COLS} FROM tenants WHERE id = ?`, [id])

export async function tenantByIngestKey(key: string): Promise<{ tenant: Tenant; kind: 'server' | 'public' } | undefined> {
  if (key.startsWith('pl_sk_')) {
    const tenant = await one<Tenant>(`SELECT ${COLS} FROM tenants WHERE ingest_key_hash = ?`, [sha256(key)])
    return tenant && { tenant, kind: 'server' }
  }
  if (key.startsWith('pl_pk_')) {
    const tenant = await one<Tenant>(`SELECT ${COLS} FROM tenants WHERE public_key = ?`, [key])
    return tenant && { tenant, kind: 'public' }
  }
  return undefined
}

export const tenantBySession = (token: string) =>
  one<Tenant>(`SELECT ${COLS} FROM tenants WHERE session_hash = ?`, [sha256(token)])

export const ownerPhones = async (tenantId: string) =>
  (await all<{ phone: string }>('SELECT phone FROM owners WHERE tenant_id = ?', [tenantId])).map((r) => r.phone)

export const tenantsForPhone = (phone: string) =>
  all<Tenant>(
    `SELECT ${COL_LIST.map((c) => `t.${c}`).join(', ')} FROM tenants t JOIN owners o ON o.tenant_id = t.id WHERE o.phone = ?`,
    [phone],
  )

/** One-time code texted from the owner's phone: proves phone ownership and opens the Keiki conversation. */
export async function redeemCode(code: string, phone: string): Promise<Tenant | undefined> {
  const tenant = await one<Tenant>(
    `SELECT ${COLS} FROM tenants WHERE onboarding_code = ? AND onboarding_expires > ?`,
    [code, Date.now()],
  )
  if (!tenant) return undefined
  const res = await run('UPDATE tenants SET onboarding_code = NULL, onboarding_expires = NULL WHERE id = ? AND onboarding_code = ?', [
    tenant.id,
    code,
  ])
  if (res.rowsAffected !== 1) return undefined
  await run('INSERT OR IGNORE INTO owners (tenant_id, phone, added_at) VALUES (?, ?, ?)', [tenant.id, phone, Date.now()])
  const guessed = tenant.timezone === 'UTC' ? timeZoneForPhone(phone) : undefined
  if (guessed) {
    await run('UPDATE tenants SET timezone = ? WHERE id = ?', [guessed, tenant.id])
    tenant.timezone = guessed
  }
  return tenant
}

export function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Fallback when the site didn't send the browser's time zone. Single-zone countries only.
const PHONE_ZONES: [string, string][] = [
  ['+91', 'Asia/Kolkata'],
  ['+44', 'Europe/London'],
  ['+65', 'Asia/Singapore'],
  ['+971', 'Asia/Dubai'],
  ['+49', 'Europe/Berlin'],
  ['+33', 'Europe/Paris'],
  ['+81', 'Asia/Tokyo'],
]

export const timeZoneForPhone = (phone: string) => PHONE_ZONES.find(([prefix]) => phone.startsWith(prefix))?.[1]

export const touchLastEvent = (tenantId: string) =>
  run('UPDATE tenants SET last_event_at = ? WHERE id = ?', [Date.now(), tenantId])

/** E.164-ish: digits with a leading +. */
export function normalizePhone(raw: string): string | undefined {
  const digits = raw.replace(/[^\d+]/g, '')
  const e164 = digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : `+${digits}`
  return /^\+\d{8,15}$/.test(e164) ? e164 : undefined
}
