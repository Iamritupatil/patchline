# Stack design

Rule: Maritime, Keiki and Supermemory are mandatory and load-bearing. Everything else is chosen to be small, typed and fast to ship in 24h.

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node 22, TypeScript (strict, ESM) | Matches NotchMan; one language everywhere |
| Dev / build | `tsx` (watch), `tsup` (bundle) | Zero-config |
| HTTP | Hono | Tiny, typed routes, fast cold start after VM wake |
| Validation | Zod | Webhooks, Keiki tool args, LLM JSON |
| LLM | Anthropic SDK: `claude-sonnet-5-5` for triage + patches, `claude-haiku-5-5` for bug/info classification | Strong patch writing; cheap classification |
| GitHub | Octokit REST | Commits, file contents, branches, PRs, merge |
| Git in VM | `simple-git` + shallow clone | Apply patch and run tests per variant |
| State | `@libsql/client` → local SQLite file on VM; same code → Turso if disk doesn't persist | One-line swap via `DATABASE_URL` |
| SNS verify | `sns-validator` | Signature checks are easy to get wrong |
| Tests | Vitest | Fast, TS-native |
| Hosting | **Maritime** (TS SDK + CLI, deploy from GitHub) | Per-customer micro-VM |
| Messaging | **Keiki** REST (outbound) + HTTP tool endpoints (inbound) | Simpler than an MCP server for MVP |
| Memory | **Supermemory** TS SDK | Repo index + incident memory |

Pin exact versions at install time.

## How each sponsor is used

### Maritime
- **Control-plane agent** (`MODE=control`): `/signup`, provisions customer agents via the Maritime SDK.
- **Customer agent per tenant** (`MODE=customer`): ingest, pipeline, Keiki tools. Demo runs 2: NotchMan + sample app.
- **Secrets:** GitHub token, owner phones, API keys.
- **Test sandbox:** clone repo, write patch, `npm ci && npm test` inside the isolated VM.
- **Sleep/wake:** agents idle when nothing breaks. **Log streaming:** shown in the demo.

### Keiki
- Outbound alert texts (or schedule-based polling if push isn't supported).
- Tools: `list_incidents`, `get_incident`, `choose_fix`, `ship`, `ignore`, `explain_more`, `weekly_summary`.
- Free-text questions answered from store + Supermemory.
- Schedule: daily info digest. Onboarding: text "start". Traces shown in the demo.

### Supermemory
- `indexRepo`: on connect, index README + source files the stack traces touch → semantic search during triage.
- `saveIncident`: diagnosis, chosen fix, outcome. `containerTag = tenant id`.
- `recall`: similar past incidents injected into the triage and fix prompts.
- `summarize`: powers "what keeps breaking?" and `weekly_summary`.

## Not using (and why)
- Express: Hono is lighter and enough.
- Postgres/ORM: overkill for one tenant per VM.
- GitHub Actions for patch tests: slower feedback and depends on the repo's triggers. Kept as a fallback (read PR check status).
- MCP server for Keiki: HTTP tools are faster to build. Revisit after the hackathon.
