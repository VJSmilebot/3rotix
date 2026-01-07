# API Standards (Keep It Simple + Cohesive)

## Runtime
- API routes run in Node.js (Prisma allowed).
- Middleware is Edge (Prisma forbidden).

## Gating
- Protected routes must use `requireAuth()` / `requireAdmin()`.

## Response shape (consistent)
- Prefer:
  - 200: `{ ok: true, data: ... }`
  - 4xx/5xx: `{ ok: false, error: "MESSAGE", details?: ... }`
- Keep errors human-readable and debuggable.

## Validation
- Validate required inputs early.
- Never trust client-submitted userId/role; derive identity from session.

## Avoid churn
- Don’t rewrite working endpoints to “improve style.”
- Make the smallest changes needed to get flows working end-to-end.
