import { randomBytes } from 'node:crypto'

// Each test file gets its own throwaway DB (relative path: the project dir contains spaces).
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = `file:./data/test/${process.pid}-${randomBytes(4).toString('hex')}.db`
process.env.KEIKI_WEBHOOK_SECRET = 'test-secret'
process.env.KEIKI_API_KEY = ''
process.env.KEIKI_AGENT_ID = ''
process.env.CORS_ORIGINS = 'http://localhost:3000'
