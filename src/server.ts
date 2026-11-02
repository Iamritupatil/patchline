import { serve } from '@hono/node-server'
import { app } from './app.js'
import { config } from './config.js'
import { log } from './log.js'
import { drain } from './pipeline.js'
import { migrate } from './store.js'

await migrate()

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  log.info('patchline listening', { port: info.port, env: config.NODE_ENV })
})

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    log.info('shutting down', { signal })
    server.close()
    await drain()
    process.exit(0)
  })
}
