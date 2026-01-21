# Workflow + Source of Truth (MUST OBEY)

## Canon docs (read first, every task)
1) /ARCHITECTURE.md
2) /AI_RULES.md
3) /XP_TRIGGERS.md

If conflict:
- ARCHITECTURE.md wins.
- If docs are wrong/outdated, STOP and propose exact doc edits (do not silently drift).

## MVP-first priorities
- Goal: a cohesive MVP that can go live + be demo’d to creators/investors fast.
- Security/perfection is Phase 2, BUT do not do reckless stuff (no secret leakage, no service role in client, auth-gate protected routes).

## Required work order (prevents wasted time)
PHASE 0: Inventory only (no edits)
PHASE 1: Architecture + DB sanity (Prisma/Supabase/Env)
PHASE 2: API foundation (Node runtime, auth wrappers, canonical clients)
PHASE 3: Auth + Profile lifecycle (ensure public.User exists)
PHASE 4: Core flows (onboarding → squads → chat/DM → portals)
PHASE 5: XP-ready (but OFF)
PHASE 6: Build/deploy readiness

Never skip phases or “bounce around” without closing the current phase.

## Output requirements per task
- Before edits: list findings + minimal fix plan.
- After edits: list exactly what changed + what intentionally did NOT change.
- Always label suggestions:
  - MVP-CRITICAL (implement now)
  - MVP-NICE (optional)
  - POST-MVP (defer)

## Solo-dev friendliness
- Prefer smallest working change over refactors.
- Avoid introducing new patterns if a canonical one exists.
- Do not ask repetitive questions; make reasonable assumptions and proceed.
