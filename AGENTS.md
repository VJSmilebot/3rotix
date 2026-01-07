# 3ROTIX — Agent Guide (AGENTS.md)

This repo is an MVP-first creator platform (3ROTIX). Goal: get a cohesive, demo-ready, go-live MVP fast.

## Source of Truth (must read first)
- `ARCHITECTURE.md`
- `AI_RULES.md`
- `XP_TRIGGERS.md`
- `.kilocode/rules/*`

If code conflicts with these docs:
1) propose the smallest fix, OR
2) explicitly recommend doc updates (don’t silently drift).

## Project Constraints (non-negotiables)
- Next.js **Pages Router** (no App Router migration).
- Supabase Auth is the only auth system (no NextAuth).
- Prisma is used, but **NO Prisma migrations**.
  - DB changes happen via Supabase SQL, then `prisma db pull` + `prisma generate`.
- Gamification/XP is currently **OFF**, but the codebase must stay “XP-ready”.
- Avoid TypeScript conversions unless the repo is already TS-heavy (prefer simple JS).
- No duplicate systems: one canonical Prisma client, one canonical Supabase client pattern, one auth flow.

## Quick Commands (update if your project diffe
