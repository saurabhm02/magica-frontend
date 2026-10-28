# AGENTS.md — Frontend (client)

Hi agent 👋 Please read this fully before writing code. If something is not clear, ask first, don't assume.

## What is this repo?

This is the **frontend** of our Agent Chat clone. It's a **pixel-close copy of Galaxy's live Agent Chat**. The live product is the reference for everything: spacing, copy, empty states, tool cards, approval overlay, artifact panel, hover states. We are **not designing anything new**. If unsure, match the live product exactly.

Backend is a separate repo (`server`). It owns all business rules and all data shapes. We only show things and call the API.

Read `docs/ARCHITECTURE.md` first, then `docs/REALTIME.md` before touching streaming code.

## Tech stack (fixed by the trial)

| Thing | What we use |
|---|---|
| Package manager | **pnpm** |
| Framework | Next.js App Router + React |
| Language | TypeScript **strict** |
| Auth | Clerk |
| Server data | **TanStack Query** |
| Client/live state | **Zustand** |
| Validation | Zod (schemas copied from backend) |
| UI | **shadcn/ui + Tailwind** only |
| Realtime | Trigger.dev Realtime React hooks |
| Uploads | Uppy + Transloadit (tus) |
| Tests | Vitest + React Testing Library + MSW + Playwright |

No other UI kits or design systems. The doc literally says don't redesign the UI. Don't add libraries without asking.

## Commands

```bash
pnpm install
pnpm dev               # http://localhost:3000
pnpm sync:contracts    # copy Zod contracts from ../server/src/contracts
pnpm typecheck
pnpm test              # vitest
pnpm test:e2e          # playwright
pnpm lint
```

Before saying "done", run `pnpm typecheck && pnpm test` and share the real result.

## Folder structure

```
src/
  app/                    # routes: /, /chat/[chatId], sign-in
  contracts/              # GENERATED copy of server contracts — never edit by hand
  services/               # typed API calls (only place that calls fetch)
  queries/                # TanStack Query hooks (useChats, useMessages, useSendMessage...)
  stores/                 # Zustand: live-run, ui, composer
  realtime/               # run stream hooks, reconnect, REST fallback
  components/
    shell/                # layout, sidebar, header
    chat/                 # message list (virtualized), message, content blocks
    tools/                # tool card renderers + renderer registry (by renderKey)
    composer/             # input, attachments, plan mode, send/stop
    approvals/            # waitpoint overlay (credit, plan)
    artifacts/            # artifact panel (generated images/videos)
    ui/                   # shadcn components
  lib/                    # utils, env
tests/  e2e/
```

## Rules

### Data + API
- **Never call `fetch` inside components.** Only `src/services/*` call the API, through `api-client.ts` (adds Clerk token, parses response with Zod, maps errors).
- Components use TanStack Query hooks from `src/queries/`.
- Never define a type that already exists in `src/contracts/`. Import it.
- `src/contracts/` is generated. If a shape is wrong, fix it in the server repo and run `pnpm sync:contracts`.

### State
- **TanStack Query** = data saved on server (chats, messages, balance, run status).
- **Zustand** = live run (streaming text, current step, tool states, waitpoint) + UI (sidebar open, artifact panel, composer draft, uploads in progress).
- Use small selectors (`useLiveRun(s => s.status)`), not the whole store, to avoid re-renders.
- When a run finishes: invalidate messages query, then clear the live bubble. **The final message must never show twice.**

### Rendering
- Message content = ordered blocks. Render each block by its `type` (text, thinking, tool_use, tool_result, reasoning, citations, usage). Keep the order.
- Tool cards are picked by `renderKey` from a registry map. Unknown key → generic card. Adding a tool = one renderer file + one line in the map.
- Message list must be **virtualized** and composer stays **pinned** at the bottom.

### Accessibility
- Keyboard works everywhere (Enter send, Shift+Enter newline, Esc closes overlays, focus goes back properly).
- Buttons with icons have `aria-label`. Live status uses `aria-live="polite"`.

### Security
- No secrets in the frontend. Only `NEXT_PUBLIC_*` safe values (Clerk publishable key, API URL).
- Never log tokens.

### Code style — write like a senior dev, not like an AI
Code should be simple enough that I can explain any component in a review without reading it twice. Doc also scores "least lines of code for the same functionality".

**Do:**
- Small components, clear names (`ToolCard`, `useSendMessage`, not `GenericWrapperComponent`).
- Derive values during render instead of syncing them with `useEffect`.
- One pattern per problem across the repo. Copy the existing pattern before inventing a new one.
- Use what shadcn / TanStack Query / Zustand already give before writing helpers.
- Match Tailwind spacing to the live product (measure with devtools).
- Comment only the **why**.

**Don't (the "AI slop" list):**
- ❌ comments that repeat the code
- ❌ `useEffect` for things that can be computed, or to copy props into state
- ❌ `useMemo` / `useCallback` everywhere "for performance" without a reason
- ❌ boolean-prop explosion (`isSmall isPrimary isRounded isCompact...`) — compose components instead
- ❌ wrapper components that only pass props through
- ❌ a giant `utils.ts`, or helpers for one-time use
- ❌ `try/catch` everywhere — errors come from `services/` as `ApiError`, handle them in one place per screen
- ❌ `console.log`, emojis in code, commented-out code, TODOs without reason
- ❌ `any`, `as unknown as X`, `!` to silence errors
- ❌ new UI libraries or custom design — we clone the live product

**Simple ≠ skipping requirements.** Accessibility, reconnect, no-duplicate finalize and the error states are required — keep them, just write them simply.

## Git
Don't commit, push or make branches. Just change files and tell me what you changed. I'll review and commit.

## When you finish a task, reply with
1. What changed (files)
2. How to see it in the browser
3. `pnpm typecheck && pnpm test` result
4. What you're unsure about / didn't match the reference yet

If the task built a decision from `docs/DECISIONS.md` into real code, add one row for it to the "Design decisions and trade-offs" table in `README.md`. That table lists only what is already built.
