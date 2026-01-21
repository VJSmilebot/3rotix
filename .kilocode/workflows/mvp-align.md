### Phase 0 — Inventory only (no edits)
- Map routes (pages/*), APIs (pages/api/*), auth modules, supabase clients, prisma client, DB models
- List top blockers in `MVP_READINESS.md`

### Phase 1 — Architecture + DB sanity
- Env usage correct, Prisma schema matches DB
- Single Prisma singleton used everywhere
- No migrations; generate SQL if schema needs changes

### Phase 2 — API foundation
- Standard auth gating wrapper for all protected endpoints
- Standard response/error shape
- No ad-hoc Supabase client creation in random files
- No service-role key on the client

### Phase 3 — Auth + Profile lifecycle
- Login -> session -> ensure profile row exists -> role comes from DB
- Middleware stays Edge-safe (no Prisma inside middleware)

### Phase 4 — Core user flows (in order)
1) Onboarding + profile
2) Squads (list/view/join/leave)
3) Chat/DM (if present)
4) Creator/Fan portals render cleanly (no duplicate nav/footers, no blank pages)

### Phase 5 — XP-ready (but OFF)
- All XP writes centralized (e.g. `lib/xp.js`)
- Feature flag makes XP no-op safely when disabled
- Existing flows must NOT depend on XP being enabled

### Phase 6 — Go-live basics
- `pnpm build` passes
- `.env.example` (or `ENVIRONMENT.md`) exists
- No secrets leak into browser bundles
- Final `MVP_READINESS.md` says “Ready / Not Ready” with remaining blockers