import { z } from 'zod'

export const LEVELS = ['debug', 'info', 'warning', 'error', 'fatal'] as const
export type Level = (typeof LEVELS)[number]

const LEVEL_ALIASES: Record<string, Level> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  notice: 'info',
  ok: 'info',
  warn: 'warning',
  warning: 'warning',
  error: 'error',
  err: 'error',
  alarm: 'error',
  critical: 'fatal',
  crit: 'fatal',
  fatal: 'fatal',
  emergency: 'fatal',
}

export const toLevel = (raw: string | undefined, fallback: Level = 'error'): Level =>
  (raw && LEVEL_ALIASES[raw.trim().toLowerCase()]) || fallback

export const AlertEvent = z.object({
  source: z.enum(['generic', 'browser', 'sns', 'sentry', 'uptime', 'test']),
  sourceId: z.string().max(200).optional(),
  service: z.string().min(1).max(100),
  level: z.enum(LEVELS),
  message: z.string().min(1).max(4000),
  stack: z.string().max(16000).optional(),
  count: z.number().int().positive().max(1_000_000).default(1),
  url: z.string().max(2000).optional(),
  environment: z.string().max(50).optional(),
})
export type AlertEvent = z.infer<typeof AlertEvent>

export const clip = (s: string | undefined, max: number) => (s === undefined ? undefined : s.slice(0, max))

export class IngestError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 413 = 400,
  ) {
    super(message)
  }
}
