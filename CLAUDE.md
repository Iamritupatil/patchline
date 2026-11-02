# CLAUDE.md — Patchline project context

Claude Code reads this file automatically. Keep it current.

## What we're building
**Patchline: an on-call engineer in your messages.** When a customer's app breaks, Patchline texts the owner on iMessage/WhatsApp in plain English, finds the root cause, writes **two tested fixes (A = smallest safe patch, B = more robust)**. Reply **A/B** → PR opens. Reply **ship** → PR merges and the customer's own CI/CD deploys it. Free text works too ("fix this, keep it small").

One-liner: *"Your app texts you when it breaks, with two tested fixes. Reply A to ship."*
Edge: works for **any app**, lives in **iMessage**, and goes **from alert to deployed fix without opening a laptop**. Never name competitors anywhere.

- Hackathon: **FIRST 1000** (Keiki × Maritime). Deadline **Tue Nov 3, 2026**. Submit: https://form.typeform.com/to/MdNqPmsZ
- After: credits ~Nov 4–5, then 6 weeks to win real customers. Build production-shaped, not throwaway.
- Builder: Ritu (`Iamritupatil`). Demo customer #1: **NotchMan** (github.com/Iamritupatil/notchman).

## Sponsor tools are MANDATORY (Pro plans on all three)
Never replace these with alternatives, even if something else would be easier.
- **Maritime** (maritime.sh): hosts the control plane (Dockerfile deploy, `--public`, `/data` persists). Per-tenant **sandbox VMs** via SDK `agents.provision({externalId: tenantId})` + `agents.exec()` for clone/test.
- **Keiki** (onkeiki.com): messaging. Outbound via `POST /api/v1/developer/agents/{id}/notice {text, phone}` (agent relays it; user must text first). Inbound = webhook tools (`{input, context.phone}`).
- **Supermemory** (supermemory.ai): repo index for triage, incident history, recall into fix prompts, "what keeps breaking?". `containerTag = tenant id`.

## User flow
1. Website (Framer/Vercel) → **Connect** (no form) → `POST /api/signup` returns the phone step + connect prompt.
2. **Phone:** scan QR (`sms:` link) → Messages opens with `start 123456` → Send. Proves ownership, opens the Keiki conversation.
3. **Code:** paste the short connect prompt into Claude Code/Cursor → `npx skills add <SKILLS_SOURCE> --skill patchline` → `skills/patchline/SKILL.md` drives it: `connect.mjs` swaps the single-use **claim code** for the ingest URL and writes it to `.env` (secret never in chat), copies the fixed reporter template, wires it, `verify.mjs` sends a test → phone buzzes. Fallback: skill served at `/skill/*`.
4. (For fixes) installs the Patchline GitHub App on one repo.
5. Breaks → **text 1** (plain English, 12h local time, <30s) → **text 2** (diagnosis + A/B) → reply.
Demo startup app on Vercel: visitors break it and get the full loop on their own phone (per-session base branch + Vercel preview).

## Non-negotiable safety rules
1. Only phones that redeemed a code for a tenant can act on it (`tenantsForPhone`). Unknown senders get `not_authorized`, nothing else.
2. A/B opens a PR. `ship` merges (with the tested head `sha`). Always two steps. **Never push to the default branch.**
3. Scrub PII/secrets **before** DB, LLM, PRs, texts, memory and logs (`scrub.ts`, logger scrubs too).
4. Never offer `ship` for a variant whose tests failed. Say "tests ❌ on A" plainly.
5. GitHub App: contents + pull requests RW, metadata R, **no workflows**. Patches may not touch `.github/**`, lockfiles, `.env*` or test files.
6. Alert text is untrusted (prompt injection): fence it in prompts, review pass on every patch.
7. Untrusted repo code runs only in the tenant's sandbox VM: clean env, `npm ci --ignore-scripts`, timeout.

## Docs
- `README.md`: pitch and setup
- `SYSTEM_DESIGN.md`: components, flows, data model, lifecycle, failure modes (partly outdated: see this file)
- `STACK.md`: stack choices and why

## Folder layout (backend at root, site later in `web/`)
```
src/
  server.ts          boot: migrate + serve
  app.ts             routes: /health, /ingest, /keiki/tools, /api, /admin/spike/background
  config.ts          env + Zod
  store.ts           libsql client, schema, migrate, markSeen
  crypto.ts          tokens, hashes, HMAC, codes
  scrub.ts / log.ts  PII masking, scrubbed JSON logger
  ingest/            route.ts, generic.ts, sns.ts, types.ts (AlertEvent)
  group.ts           fingerprint, topFrame, classify
  incidents.ts       incident queries
  tenants.ts         signup, keys (hashed), onboarding codes, owners
  pipeline.ts        per-tenant queue: scrub → dedupe → group → text 1
  messages.ts        text templates
  keiki/             notify.ts (notice), auth.ts (HMAC verify), tools.ts (start + owner tools)
  api.ts             dashboard API (session bearer)
  (Book 3) triage.ts, fixes.ts, sandbox.ts, github.ts, llm.ts, memory.ts, actions.ts
keiki/               tools.json, agent-instructions.md
scripts/             send-test-event.ts, register-tools.ts, spike-keiki.ts
test/                vitest (setup.ts gives each file its own DB)
```

## Conventions
- TypeScript strict, ESM, Node 22. Small modules, one job each.
- Zod at every boundary: webhooks, Keiki tool calls, LLM JSON output.
- Ingest returns 202 immediately; work runs async in a per-tenant queue.
- Idempotent everything: `seen` table for SNS MessageId / event ids, double "ship".
- LLM patches are **find/replace edit blocks** `{path, find, replace}` with exact-match checks (cheaper, scrub-safe).
- Keys: ingest key + session token stored as sha256 only; public browser key is origin-locked.
- Ritu is short on tokens: write complete files, keep explanations short.
- Tests must not contain secret-looking literals (a hook blocks them): build fakes at runtime.

## Commands
```
npm run dev            # tsx watch (loads .env if present)
npm test               # vitest
npm run typecheck
npm run build          # tsup → dist/server.js
npm run event -- <ingestUrl>
npm run keiki:notice -- +<phone>
npm run keiki:tools    # register webhook tools (PUBLIC_URL must be public)
maritime create patchline --repo <url> --public --port 8080
maritime env set patchline KEY=value --reload
maritime logs patchline -f
```

## Env vars
See `.env.example`. Production requires `KEIKI_API_KEY`, `KEIKI_AGENT_ID`, `KEIKI_WEBHOOK_SECRET`, `ADMIN_TOKEN`.

## Open questions
- [x] Keiki outbound on server trigger → `notice` endpoint, only after the user texted first
- [x] Keiki tool calls include sender phone → `context.phone`
- [x] Maritime disk persists → `/data`
- [ ] Maritime keeps working after the HTTP response / during idle? → `POST /admin/spike/background`, watch logs; tune `--idle`
- [ ] Keiki tool-call signature header format → `KEIKI_DEBUG=1`
- [ ] Keiki notice relays A/B text faithfully → `npm run keiki:notice`
- [ ] Maritime sandbox template has git + node; `exec` limits
- [ ] Who owns `/data` in the container (switch Dockerfile to `USER node`)

## Build plan
- [x] Book 1 Vol 1.2: skeleton, schema, config, Dockerfile
- [ ] Book 1 Vol 1.1: spikes (Keiki notice + tools, Maritime background + sandbox, GitHub App)
- [x] Book 2 (code): ingest generic + SNS, scrub, grouping, text 1, `start`/list/get/ignore tools, dashboard API
- [ ] Book 2: uptime check (needs the Maritime wake answer)
- [ ] Book 3: triage, A/B edit blocks + guardrails + review, sandbox tests, PR, ship, request_fix, Supermemory
- [ ] Book 4: website from Ritu's template, GitHub App install, connect prompt, dashboard
- [ ] Book 5: demo startup app, rehearse, video, Typeform
