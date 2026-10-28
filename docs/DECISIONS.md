# Decisions Log (frontend)

**Decision** — why — what we gave up. Backend decisions are in `server/docs/DECISIONS.md`.

---

**F1. Types come from the backend (`pnpm sync:contracts`), never hand-written.**
Doc: frontend consumes backend types. Copy is committed so Vercel builds work alone.
Trade-off: must re-sync after backend contract changes; CI checks the copy is up to date.

**F2. TanStack Query for server data, Zustand for live run + UI.**
Saved data needs caching, pagination and refetch-on-reconnect (Query is made for this). Live streaming changes many times a second; Zustand with small selectors keeps re-renders low.

**F3. All API calls through `services/*` with Zod parsing.**
Doc says no raw fetch scattered in components. One place adds auth, validates shapes, maps errors.

**F4. Finalize = refetch first, then clear live bubble.**
Prevents the classic "final message shows twice" bug.

**F5. Tool cards by `renderKey` registry with a generic fallback.**
Adding a tool on the backend doesn't break the UI; a nicer card is one file + one map entry.

**F6. `clientRequestId` generated once per send.**
Network retry of the same send = same run on backend, no duplicate turns.

**F7. Virtualized message list (`@tanstack/react-virtual`).**
Long conversations stay smooth. Doc lists virtualization under performance.

**F8. shadcn + Tailwind only, measurements from live product.**
Doc: don't redesign, match the reference. No extra UI kits.
