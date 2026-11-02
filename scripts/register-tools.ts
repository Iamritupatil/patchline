// Registers keiki/tools.json as webhook tools pointing at PUBLIC_URL. Usage: npm run keiki:tools
import { readFileSync } from 'node:fs'
import { config } from '../src/config.js'

type ToolDef = { name: string; description: string; inputSchema: unknown }

if (!config.KEIKI_API_KEY) throw new Error('KEIKI_API_KEY missing')
if (config.PUBLIC_URL.includes('localhost')) throw new Error('PUBLIC_URL must be the public Maritime URL')

const tools = JSON.parse(readFileSync(new URL('../keiki/tools.json', import.meta.url), 'utf8')) as ToolDef[]

for (const t of tools) {
  const res = await fetch(`${config.KEIKI_BASE_URL}/api/v1/developer/tools`, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.KEIKI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      ...t,
      executionType: 'webhook',
      webhookUrl: `${config.PUBLIC_URL}/keiki/tools/${t.name}`,
      ...(config.KEIKI_AGENT_ID ? { agent_id: config.KEIKI_AGENT_ID } : {}),
    }),
  })
  console.log(t.name, res.status, (await res.text()).slice(0, 300))
}
