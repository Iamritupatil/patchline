---
name: patchline
description: Connect a JavaScript/TypeScript web app or API to Patchline, which texts the owner on iMessage when the app breaks and offers fixes they approve by replying. Use when the user pastes a Patchline connect prompt (it contains a "pl_claim_" code) or asks to add Patchline error reporting.
---

# Connect an app to Patchline

Goal: the app reports crashes and server errors to Patchline. The change must be small, safe and reversible: one reporter file, a few lines of wiring, one env var. No new dependencies.

`SKILL_DIR` below means the folder containing this file. If you are reading this from a URL instead of an installed skill, download the files you need from the same base URL (`<api>/skill/scripts/connect.mjs`, `<api>/skill/scripts/verify.mjs`, `<api>/skill/templates/patchline.ts`, `<api>/skill/templates/patchline.js`) into a temp folder and use those paths.

## 0. Inputs
- **Claim code** (`pl_claim_…`) and **Patchline API** URL from the user's prompt. If either is missing, stop and ask. Never invent one.
- Monorepo: ask which app (the server that handles requests) before continuing.
- Only JavaScript/TypeScript (Node, Next.js, Express, Hono, Fastify, NestJS) is supported for now. For anything else, tell the user it's coming soon and stop.

## 1. Claim (writes the secret for you)
Run from the app's folder:
```
node "<SKILL_DIR>/scripts/connect.mjs" --claim <code> --api <api> --dir .
```
Add `--origins https://myapp.com,https://www.myapp.com` if the app has a browser frontend and you know its production domain(s).

It writes `PATCHLINE_URL` (and `NEXT_PUBLIC_PATCHLINE_URL` / `PATCHLINE_PUBLIC_URL` with origins) into the right env file, adds `PATCHLINE_URL=` to `.env.example`, and makes sure the env file is gitignored. It prints JSON **without the secret**.

**Never print, echo, cat, grep or log the env file or `PATCHLINE_URL`.** Never put the value in code, commits or chat.

If it fails with "invalid, used or expired", ask the user for a new prompt from the Patchline site.

## 2. Add the reporter
Copy `<SKILL_DIR>/templates/patchline.ts` (TypeScript projects) or `patchline.js` (JavaScript, ESM) next to the server entry, e.g. `src/patchline.ts`. Do not change its logic. For CommonJS projects, convert only `export` to `module.exports`.

## 3. Wire it in (only what applies)
| Stack | Change |
|---|---|
| Any Node server | Call `installPatchline()` once at startup, before the server listens. |
| Express | After all routes: `app.use((err, req, res, next) => { reportError(err, { url: req.originalUrl }); next(err) })` |
| Next.js (App Router, 15+) | In `instrumentation.ts` (project root or `src/`): `export async function onRequestError(err, request) { if (process.env.NEXT_RUNTIME === 'nodejs') { const { reportError } = await import('./patchline'); await reportError(err, { url: request.path }) } }`. Do not call `installPatchline()` in Next.js. |
| Hono | `app.onError((err, c) => { reportError(err, { url: c.req.path }); return c.text('Internal Server Error', 500) })` (keep any existing onError body, just add the report call). |
| Fastify | `app.setErrorHandler((err, req, reply) => { reportError(err, { url: req.url }); reply.send(err) })` |
| NestJS | In the existing global exception filter, call `reportError(exception, { url: request.url })` for 5xx. If none exists, skip this and rely on `installPatchline()`. |
| Existing `catch` that returns a 5xx | Add `reportError(err, { url })` inside it. Do this for the main request paths only; don't touch every catch. |

Browser frontend (only if step 1 wrote a public URL): copy the `installBrowserPatchline` function (bottom of `templates/patchline.js`) into the client entry and call it once with the public variable: `installBrowserPatchline(process.env.NEXT_PUBLIC_PATCHLINE_URL)` in Next.js (inside a client component's `useEffect`), or the bundler's equivalent for `PATCHLINE_PUBLIC_URL` (e.g. `import.meta.env.VITE_PATCHLINE_PUBLIC_URL`, renaming the var to match). Never use `PATCHLINE_URL` in browser code.

## 4. Verify
```
node "<SKILL_DIR>/scripts/verify.mjs" --dir .
```
It sends a test event using the configured env var. Expected: `{"ok":true}` and the owner's phone gets "✅ Test alert … received". If it fails, fix the cause (wrong folder, env file not written) and rerun. Do not call the job done until verify returns ok.

## 5. Tell the user (short)
- Files changed (show the diff).
- **Add `PATCHLINE_URL` to your hosting provider's environment variables** (Vercel, Render, Railway, Fly, AWS…) with the same value as in the env file, then redeploy. Offer to do it with the provider's CLI if it is installed and logged in (e.g. `vercel env add PATCHLINE_URL production`, piping the value from the env file without printing it).
- If the claim output says `phoneConnected: false`: "Text `<phone.text>` to Patchline from your iPhone to get alerts." (use the exact text from the output).

## Rules
- No new dependencies. Change nothing beyond the reporter file, the wiring above and env files.
- The reporter must never throw, block a response, or log the URL.
- Don't remove or weaken the app's existing error handling or logging.
