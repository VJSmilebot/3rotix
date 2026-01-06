# AI_RULES (3ROTIX) — Canonical Engineering Rules

**Status:** Source of Truth  
**Applies to:** Entire repo  
**Canon docs (MUST READ FIRST):**
1) `/ARCHITECTURE.md` (v1.6)
2) `/AI_RULES.md` (this file)
3) `/XP_TRIGGERS.md`

If anything conflicts: **ARCHITECTURE.md wins.**

---

## 0) Non-Negotiables

- **No NextAuth. Ever.** Supabase Auth is the only authentication system.
- **No Prisma migrations.** Do not run:
  - `prisma migrate dev`
  - `prisma migrate deploy`
  - Any migration commands in CI/production  
  Schema changes happen via **Supabase SQL**, then:
  - `prisma db pull`
  - `prisma generate`
- **Prisma is PUBLIC-only.** Models map to the `public` schema only.
- **All XP writes go through `lib/xp.js` only.** Never write XP or XPLog anywhere else.
- **Authorization source:** `public.User.role` (Prisma).  
  JWT claims are **verification only**, not authority for admin/mod.
- **One Prisma client singleton** (`lib/prisma.js`). No other PrismaClient instances.
- **No service role on the client.** `SUPABASE_SERVICE_ROLE_KEY` must never touch browser bundles.

---

## 1) Package / Version Rules (Pinned)

- Use **pnpm**.
- Commit `pnpm-lock.yaml`. Never delete it.
- Keep versions pinned exactly as specified in `/ARCHITECTURE.md` (v1.6).
- If dependencies drift from the pinned versions, fix with pnpm using exact pins.

**Expected pin targets (current canon):**
- `prisma` = `6.19.1` (devDependencies)
- `@prisma/client` = `6.19.1` (dependencies)
- `@supabase/ssr` = `0.6.1`
- `@supabase/supabase-js` = `2.56.1`
- `next` = `13.4.19`

---

## 2) Canonical Files & Imports

### Prisma
- Only import prisma from:
  - `lib/prisma.js`

### Supabase Clients (only these)
- Browser:
  - `utils/supabase/client.js`
- Server (API routes + SSR helpers):
  - `utils/supabase/server.js`
- Service role (admin-only server tasks):
  - `lib/supabaseAdmin.js`

**Forbidden:**
- Creating ad-hoc Supabase clients inside random API files
- Copy/pasted supabase client snippets across the repo

---

## 3) Runtime Rules (Where code is allowed)

### Middleware (Edge)
- **No Prisma**
- Only job: `updateSession()` proxy for **page routes**
- Middleware does **not** run on `/api/*`

### API Routes (Node.js)
- Prisma allowed
- All routes must use:
  - `requireAuth()` or `requireAdmin()` from `lib/auth-middleware.js`

### Client Components (Browser)
- No Prisma
- No service role
- Use `useAuth()` from `context/AuthContext.js`

---

## 4) Auth Rules

### Standard routes
- Gate access via `getUser()` (Supabase SSR server client)
- Authorize via Prisma `public.User.role`

### Elevated routes (admin, payouts, moderation)
- Verify JWT signature via `getClaims()` **(verification only)**
- Authorize via Prisma `public.User.role`

### Profile existence
- On first authenticated use, ensure `public.User` exists (auto-provision route like `/pages/api/user/ensure.js`).
- Do not assume the Prisma User row exists just because Supabase Auth user exists.

---

## 5) Prisma Rules

- **Singleton only** (`lib/prisma.js`)
- Use `prisma.$transaction()` for multi-write operations.
- Never connect Prisma through transaction pooler mode.
- DATABASE connections:
  - `DATABASE_URL` uses Supavisor session pooler (5432)
  - `DIRECT_URL` is used for CLI tasks (db pull/generate)

---

## 6) XP Rules (Hard Law)

### Canonical XP modules
- XP awarding: `lib/xp.js`
- Trigger definitions: `/XP_TRIGGERS.md`

### Idempotency (required)
- Every XP award must include a stable `idempotencyKey`.
- `XPLog.idempotencyKey` is **NON-NULLABLE**.
- Use unique constraint: `@@unique([userId, idempotencyKey])`
- Concurrency-safe pattern: create XPLog first, catch `P2002`, then update User XP.

### Forbidden
- Any direct `prisma.xPLog.create()` outside `lib/xp.js`
- Any XP increment outside `lib/xp.js`

---

## 7) Security Rules

- Never log raw tokens, service keys, or full cookies.
- Never store raw IPs. If tracked, store `sha256(ip + salt)` only.
- RLS applies to Supabase client paths; Prisma is trusted server path.  
  Therefore: server routes MUST enforce auth + ownership checks.

---

## 8) When using AI / code generation

When generating or modifying code, ALWAYS:
1) Identify the runtime (browser / middleware / api route).
2) Use the canonical client for that runtime.
3) Use the canonical auth wrapper for API routes.
4) If XP is involved: route all XP logic through `lib/xp.js`.

If a proposed change violates any section here: **reject it and rewrite.**
