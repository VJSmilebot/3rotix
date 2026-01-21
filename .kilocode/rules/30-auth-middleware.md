# Auth & Middleware (Supabase Auth Only)

## Auth system
- Supabase Auth is the only authentication system.
- Forbidden: NextAuth (ever), mixed auth providers, or parallel session systems.

## Middleware (Edge runtime)
- Middleware must NOT import Prisma.
- Middleware’s job: session proxy/updateSession for PAGE routes only.
- Middleware does not protect `/api/*` (APIs must self-gate).

## API auth gating (Node runtime)
- Every protected API route MUST use:
  - `requireAuth()` or `requireAdmin()` from `lib/auth-middleware.js`
- Authorization source of truth:
  - `public.User.role` (Prisma)
- JWT claims are verification only (not role authority).

## Profile existence
- Never assume Prisma `public.User` exists because Supabase user exists.
- First authenticated use must ensure a `public.User` row exists (via ensure route).
