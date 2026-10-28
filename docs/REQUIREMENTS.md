# Frontend Requirements Checklist

From the task doc. Tick only when it works in the browser end to end. **D1/D2/D3** = POA day, **B** = bonus.

## Setup (D1)
- [ ] pnpm, Next.js App Router, TS strict, Tailwind, shadcn
- [ ] Clerk sign in / sign up, protected routes
- [ ] `services/api-client.ts` with token + Zod parsing + error mapping
- [ ] TanStack Query provider + `queries/keys.ts`
- [ ] `pnpm sync:contracts` script

## Thin slice (D1)
- [ ] chat page with composer → send → live streaming text → saved message after finish
- [ ] no duplicate final message

## Workspace (D2–D3)
- [ ] responsive shell: sidebar, message list, pinned composer, artifact panel
- [ ] composer: multiline, OpenRouter Free status, attachments, media picker, plan mode, send / interrupt / stop states
- [ ] accessibility: keyboard nav, focus management, screen-reader labels, visible error recovery
- [ ] mobile + desktop keep same conversation and controls
- [ ] fidelity checklist in `docs/UI-FIDELITY.md`

## Messages (D2)
- [ ] roles: user, assistant, system, tool; states success / failed / cancelled
- [ ] content blocks: text, thinking, tool use, tool result, reasoning, citations, usage (order kept)
- [ ] generated image / video / audio rendered + artifact panel
- [ ] failed + cancelled turns visible, retryable, look different
- [ ] virtualized list, cursor "load older"

## Realtime (D2)
- [ ] status: thinking → working → complete / failed / cancelled / stopping (+ waiting)
- [ ] token-by-token text, thinking duration, current step, progress
- [ ] tool states distinct + accessible
- [ ] assets appear as they complete, then persisted readback
- [ ] tool detail: sanitized input/output, duration, credits, safe errors
- [ ] reconnect: bounded retries, token refresh, REST fallback
- [ ] reload / switch chat resumes active run

## Approvals (D2)
- [ ] credit approval overlay
- [ ] plan approval overlay
- [ ] double click safe, expiry handled

## Credits (D2)
- [ ] balance shown, insufficient credits message, per-tool cost + turn total visible

## Attachments (D3)
- [ ] Uppy + Transloadit + tus, multiple files, progress, cancel, retry, reconnect
- [ ] stable order, optimistic previews
- [ ] limits: type, count, size (0.5 GB), quota errors shown clearly

## Chat management (D3)
- [ ] chat list cursor pagination
- [ ] search titles + content
- [ ] pin / unpin, rename, delete (with confirm)

## Tests (D3)
- [ ] Vitest + RTL: blocks, tool renderer registry, composer states
- [ ] MSW: API + streaming mocks, reconnect, duplicate-free finalize
- [ ] Playwright: one happy path (sign in → send → stream → tool result)

## Ship (D3)
- [ ] deployed on Vercel, env set
- [ ] README: setup, architecture, decisions, what next
- [ ] demo video (5 min max), working test credentials
