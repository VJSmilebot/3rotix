# Canonical Files & Imports (NO DUPLICATES)

## Prisma (singleton only)
- Only import Prisma from: `lib/prisma.js`
- Forbidden: creating PrismaClient anywhere else.

## Supabase (only these clients)
- Browser client: `utils/supabase/client.js`
- Server client (SSR/API helpers): `utils/supabase/server.js`
- Admin/service role (server only): `lib/supabaseAdmin.js`

Forbidden:
- Ad-hoc `createClient()` scattered across API routes/components
- Multiple “helper” auth files that overlap responsibilities

## Auth / middleware
- API route gating must use: `lib/auth-middleware.js` (`requireAuth()` / `requireAdmin()`)
- Server auth helpers live in: `lib/auth.js`
- Client auth consumption must use: `context/AuthContext.js`

## Rule of 1
If multiple versions exist:
- Pick ONE canonical implementation aligned with ARCHITECTURE.md + AI_RULES.md
- Replace all imports to point to the canonical file
- Delete/retire duplicates (or explicitly mark them deprecated + unused)
