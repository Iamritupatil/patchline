import { z } from 'zod'
import { AlertEvent, IngestError, clip, toLevel } from './types.js'

const GenericBody = z.object({
  id: z.string().optional(),
  service: z.string().optional(),
  level: z.string().optional(),
  message: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
  stack: z.string().optional(),
  count: z.coerce.number().int().positive().optional(),
  url: z.string().optional(),
  environment: z.string().optional(),
  test: z.boolean().optional(),
})

/** `{service, level, message, stack?, count?, url?}`, also sent by the connect-prompt reporter. */
export function parseGeneric(body: unknown, source: 'generic' | 'browser'): AlertEvent {
  const parsed = GenericBody.safeParse(body)
  if (!parsed.success) throw new IngestError(`invalid body: ${parsed.error.issues[0]?.message ?? 'unknown'}`)
  const b = parsed.data
  const message = b.message ?? b.error
  if (!message) throw new IngestError('message is required')

  return AlertEvent.parse({
    source: b.test ? 'test' : source,
    sourceId: clip(b.id, 200),
    service: clip(b.service?.trim() || 'app', 100),
    level: toLevel(b.level),
    message: clip(message, 4000),
    stack: clip(b.stack, 16000),
    count: Math.min(b.count ?? 1, 1_000_000),
    url: clip(b.url, 2000),
    environment: clip(b.environment, 50),
  })
}
