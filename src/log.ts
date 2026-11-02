import { scrub } from './scrub.js'

type Level = 'info' | 'warn' | 'error'

function write(level: Level, msg: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'test' && level === 'info') return
  const line = scrub(JSON.stringify({ t: new Date().toISOString(), level, msg, ...data }))
  ;(level === 'error' ? console.error : console.log)(line)
}

export const log = {
  info: (msg: string, data?: Record<string, unknown>) => write('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => write('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => write('error', msg, data),
}

export const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err))
