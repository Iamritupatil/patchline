import { createClient, type InValue } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from './config.js'

if (config.DATABASE_URL.startsWith('file:')) {
  mkdirSync(dirname(config.DATABASE_URL.slice('file:'.length)), { recursive: true })
}

export const db = createClient({ url: config.DATABASE_URL, authToken: config.DATABASE_AUTH_TOKEN })

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    repo TEXT,
    default_branch TEXT NOT NULL DEFAULT 'main',
    github_installation_id INTEGER,
    test_cmd TEXT NOT NULL DEFAULT 'npm test',
    test_dir TEXT NOT NULL DEFAULT '.',
    ingest_key_hash TEXT UNIQUE NOT NULL,
    public_key TEXT UNIQUE NOT NULL,
    allowed_origins TEXT NOT NULL DEFAULT '[]',
    uptime_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    session_hash TEXT UNIQUE NOT NULL,
    onboarding_code TEXT UNIQUE,
    onboarding_expires INTEGER,
    claim_hash TEXT UNIQUE,
    claim_expires INTEGER,
    last_event_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS owners (
    tenant_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (tenant_id, phone)
  )`,
  `CREATE INDEX IF NOT EXISTS owners_phone ON owners(phone)`,
  `CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    service TEXT NOT NULL,
    title TEXT NOT NULL,
    sample TEXT NOT NULL,
    regression INTEGER NOT NULL DEFAULT 0,
    count INTEGER NOT NULL DEFAULT 1,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    diagnosis TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS incidents_fp ON incidents(tenant_id, fingerprint, id)`,
  `CREATE INDEX IF NOT EXISTS incidents_tenant ON incidents(tenant_id, id)`,
  `CREATE TABLE IF NOT EXISTS fixes (
    incident_id INTEGER NOT NULL,
    variant TEXT NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    branch TEXT,
    summary TEXT,
    lines_changed INTEGER,
    tests TEXT NOT NULL DEFAULT 'pending',
    test_log_tail TEXT,
    tested_sha TEXT,
    pr_number INTEGER,
    pr_url TEXT,
    PRIMARY KEY (incident_id, variant, attempt)
  )`,
  `CREATE TABLE IF NOT EXISTS mutes (
    tenant_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    PRIMARY KEY (tenant_id, fingerprint)
  )`,
  `CREATE TABLE IF NOT EXISTS seen (key TEXT PRIMARY KEY, at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS llm_usage (
    tenant_id TEXT NOT NULL,
    day TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, day)
  )`,
]

// Columns added after a table first shipped. Idempotent: "duplicate column" is ignored.
const ADDED_COLUMNS = [
  `ALTER TABLE tenants ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'`,
  `ALTER TABLE tenants ADD COLUMN claim_hash TEXT`,
  `ALTER TABLE tenants ADD COLUMN claim_expires INTEGER`,
  `CREATE UNIQUE INDEX IF NOT EXISTS tenants_claim ON tenants(claim_hash)`,
]

const SEEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function migrate() {
  await db.batch(SCHEMA, 'write')
  for (const sql of ADDED_COLUMNS) {
    await db.execute(sql).catch((err: unknown) => {
      if (!String(err).includes('duplicate column')) throw err
    })
  }
  await run('DELETE FROM seen WHERE at < ?', [Date.now() - SEEN_TTL_MS])
}

export async function all<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const res = await db.execute({ sql, args })
  return res.rows as unknown as T[]
}

export async function one<T>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0]
}

export async function run(sql: string, args: InValue[] = []) {
  return db.execute({ sql, args })
}

/** Returns false if the key was already recorded (idempotency for SNS / Keiki retries). */
export async function markSeen(key: string): Promise<boolean> {
  const res = await run('INSERT OR IGNORE INTO seen (key, at) VALUES (?, ?)', [key, Date.now()])
  return res.rowsAffected === 1
}
