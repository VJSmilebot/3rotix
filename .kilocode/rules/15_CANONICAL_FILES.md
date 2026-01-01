# Canonical Files (Single Source of Truth)

These are the ONLY approved “source-of-truth” files for core platform clients/helpers.
Do not create alternate versions. Do not duplicate patterns. Do not invent new client files.

If a request seems to require a new client/helper:
- STOP
- Explain why
- Propose updating one of the canonical files instead

---

## 1) Prisma (Database Access)

### Canonical Prisma Client
- `lib/prisma.js`

Rules:
- All server-side DB access MUST import Prisma from `lib/prisma.js`
- Do not create new Prisma client instances elsewhere
- Do not add additional prisma client helpers (e.g., `prismaClient.js`, `db.js`, etc.)

---

## 2) Supabase (Auth + Storage ONLY)

Supabase is permitted ONLY for:
- Auth/session verification
- Storage operations (uploads/downloads)

Supabase is NOT permitted for:
- Direct database queries from app code

### Canonical Supabase Clients
- `utils/supabase/client.js` (client-side / browser usage)
- `utils/supabase/server.js` (server-side usage)

Rules:
- Client-side code MUST import Supabase from `utils/supabase/client.js`
- Server-side code MUST import Supabase from `utils/supabase/server.js`
- Do not create additional Supabase client helpers (e.g., `supabase.js`, `sb.js`, `supabaseClient.js`)

---

## 3) Auth Verification Helper (Server-Side)

### Canonical JWT Verification Helper
- `lib/auth.js`

Rules:
- All protected API routes MUST verify identity via `lib/auth.js`
- Identity MUST come from Supabase JWT
- Never trust client-provided `userId`

---

## 4) XP + Achievements (Centralized Only)

### Canonical XP / Achievement Utilities
- `utils/xp.js`
- `utils/achievements.js`
- `utils/chat-tracker.js`

Rules:
- XP must be awarded ONLY via these utilities
- No inline XP logic in API routes or components
- Every XP grant MUST create an `XPLog` and update totals transactionally

---

## 5) If You Don’t Know the File Exists

If any of the canonical files above do not exist in the repo:
- DO NOT create a new pattern or file name
- Instead, ask which file currently serves that role, then update this rule file
