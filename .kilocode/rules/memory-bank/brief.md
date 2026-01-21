3ROTIX is a creator-first platform for adult creators + fans, built to be ethical, sex-positive, and anti-exploitation.
Primary goal: ship a cohesive, demo-ready MVP ASAP for creator onboarding and investor pitching.
Stack: Next.js (Pages Router), TailwindCSS, Prisma, Supabase (Auth + Postgres), deployed on Vercel.
Auth: Supabase Auth only (no NextAuth); client uses Supabase anon key; server uses service role only on server.
Database policy: NO Prisma migrations; DB changes happen via Supabase SQL, then prisma db pull + prisma generate.
Core MVP flows to work end-to-end: sign-in → ensure public User profile exists → basic profile view/edit.
Core MVP flows next: squads (list/view/join/leave) and chat/DM (send/read) using gated API routes.
All protected API routes must be auth-gated server-side; middleware must stay Edge-safe (no Prisma in middleware).
Avoid duplicate systems: one canonical Prisma client, one canonical Supabase client pattern, one auth flow.
Gamification/XP is currently OFF but must be easy to enable later via a feature flag (XP_ENABLED).
XP rules: XP writes must be centralized (e.g., lib/xp.js) and use idempotency keys + XPLog when enabled.
MVP-first: prioritize “works and coherent” over perfection; security hardening comes after MVP is live.
Never leak secrets to the browser bundle; never log tokens or service role keys.
Keep changes minimal and readable (solo dev, beginner-friendly); don’t refactor unless required to fix the flow.
During work, propose optional upgrades/ideas, but label them MVP-CRITICAL / MVP-NICE / POST-MVP.
