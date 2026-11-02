// Sends a realistic error to an ingest URL. Usage: npm run event -- <ingestUrl>
const url = process.argv[2]
if (!url) throw new Error('usage: npm run event -- https://<agent>.mtm.sh/ingest/<key>')

const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    service: 'api',
    level: 'error',
    message: "TypeError: Cannot read properties of undefined (reading 'secret')",
    stack: [
      "TypeError: Cannot read properties of undefined (reading 'secret')",
      '    at verifyWebhook (/app/server/src/billing.ts:42:31)',
      '    at /app/node_modules/express/lib/router/layer.js:95:5',
    ].join('\n'),
    url: '/api/billing/webhook',
  }),
})
console.log(res.status, await res.text())
