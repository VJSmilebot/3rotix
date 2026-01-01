# 3ROTIX Platform – Architecture

This document is the source of truth for how 3rotix is built. Any code changes, AI suggestions, or refactors must follow this.

## System Architecture Diagram

```mermaid
graph TB
    A[Client (React/Next.js)] --> B[Supabase Auth]
    A --> C[API Routes (Next.js)]
    A --> D[Socket.IO Client]

    C --> E[Prisma Client]
    E --> F[(Supabase Postgres)]

    D --> G[Socket.IO Server]
    G --> E

    B --> H[Supabase JWT]
    H --> C
    H --> G

    I[Admin Operations] --> J[Supabase Admin Client]
    J --> K[Supabase Storage]

    L[XP/Achievement Logic] --> E
    L --> M[utils/xp.js]
    L --> N[utils/achievements.js]
    L --> O[utils/chat-tracker.js]

    P[Services] --> Q[services/squad-chat.js]
    P --> R[services/squad-stats.js]

    C --> P
    G --> P
```

## Non-negotiables

1. Auth is Supabase only. Do not add NextAuth.
2. Database access is Prisma only. Do not query Postgres with Supabase from app code.
3. No Prisma migrations. Schema changes are applied via Supabase SQL, then Prisma schema is updated to match.
4. IDs are never faked. Do not add `id: String` anywhere. Only set an `id` explicitly if the model has no default and the architecture explicitly says it requires manual IDs.
5. XP/achievements are centralized. Do not award XP in random components/routes. Use the XP utilities only.
6. Counters must be consistent. Anything that changes membership rows and counts must be transactional.
7. One canonical client per concern. One Prisma client file. One Supabase browser client file. One Supabase admin client file.

---

## Stack

- Framework: Next.js (Pages Router)
- UI: React + TailwindCSS
- API: Next.js API routes under `pages/api`
- DB: Supabase Postgres
- ORM: Prisma
- Auth: Supabase Auth
- Storage: Supabase Storage (avatars/media)
- Realtime chat: Socket.IO (current approach)
- Streaming: Livepeer (optional / not core to MVP)

---

## Identity and Auth

### Source of truth
- Supabase Auth handles sessions.
- Prisma `User` model is the application identity record (role, XP, handle, public profile).

### Rules
- Do not use NextAuth anywhere.
- The frontend uses Supabase session to know who the user is.
- API routes can receive `userId` from the client for MVP flows. For higher security later, validate Supabase JWT server-side.

---

## Supabase client files and imports

Supabase is used for:
- Auth session on the client
- Storage uploads/downloads (avatars/media)
- Optional server-side verification (later)

Supabase is not used for:
- Querying or mutating core application tables (that is Prisma)

### Canonical paths
Use these exact modules everywhere:

- Browser/client Supabase:
  - File: `lib/supabaseClient.js`
  - Import: `import { supabase } from "@/lib/supabaseClient"`

- Server/admin Supabase (service role, storage admin only):
  - File: `lib/supabaseAdmin.js`
  - Import: `import { supabaseAdmin } from "@/lib/supabaseAdmin"`

If the `@/` alias is not configured yet, configure it (recommended) or use stable relative paths consistently. Do not invent new supabase client files in random folders.

### Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never exposed to client)

---

## Database and Prisma

### Prisma is the only DB access in app code
- Prisma client lives in `lib/prisma.js`
- Import: `import { prisma } from "@/lib/prisma"` (preferred)

Do not create duplicates like `utils/prisma.js`, `db/prisma.js`, etc.

### No Prisma migrations
We do not use:
- `prisma migrate dev`
- `prisma migrate deploy`
- migration folders as the source of truth

We do use:
- Supabase SQL editor (or SQL files committed to repo) for schema changes
- Update `prisma/schema.prisma` to match the live DB
- Run `npx prisma generate` after schema changes

Recommended workflow for schema changes:
1. Write SQL in `supabase/sql/<date>_<change>.sql`
2. Apply it in Supabase (SQL editor / migration runner)
3. Update `prisma/schema.prisma` to match reality
4. Run `npx prisma generate`
5. Smoke-test key flows

### IDs and defaults
Rule:
- If Prisma model has `@default(uuid())`, do not pass `id` in create/upsert.
- If Prisma model does not have a default for `id`, you must pass a real id value (UUID). The architecture should explicitly call this out per-model.

Never add fake placeholders such as:
- `id: String`
- `id: "String"`
- `id: someType`
- `id: undefined`

---

## Gamification architecture

Core utilities:
- `lib/xp.js`
  - Low-level XP awarding logic
  - Writes `XPLog`
  - Updates user totals and derived rank/level in a consistent way
- `utils/achievements.js`
  - Achievement definitions and progress/completion rules
  - Upserts user achievement progress
- `utils/chat-tracker.js`
  - The orchestration layer for chat XP and related achievements
- `utils/xp-manager.js`
  - Legacy shim forwarding to `lib/xp.js`

Principles:
- XP is granted only through centralized functions (never ad-hoc increments).
- Every XP grant writes an `XPLog` row with an idempotency key.
- The returned shape of XP results must be stable across calls.

---

## Squads and membership

Key models:
- `Squad`
- `SquadMember` with a composite unique key on `(squadId, userId)`

Join behavior:
- The join endpoint must:
  1. Verify squad exists
  2. Check existing membership
  3. Create membership if needed
  4. Update the squad memberCount in the same transaction

Counters:
- Any time membership changes, memberCount must change in the same transaction.
- Any time messages contribute to squad stats, those updates must be consistent and resilient to duplicates.

---

## Chat system

Server-side:
- Message creation happens server-side and is the source of truth.
- On message save:
  - validate permissions
  - persist message
  - award XP via `trackChatActivity`
  - emit event via Socket.IO including reward payload

Client-side:
- Chat UI displays messages and reacts to server events.
- XP toasts/badges are displayed based on the reward payload from the server.

---

## API design patterns

- API routes live under `pages/api/**`
- Each route:
  - validates method
  - validates required inputs
  - uses Prisma for DB work
  - returns JSON: `{ ok: true, ... }` or `{ error, details }`
  - never imports NextAuth
  - never performs raw SQL from the route

---

## Repo docs

These docs are authoritative:
- `ARCHITECTURE.md` (this file)
- `AI_RULES.md`
- `XP_TRIGGERS.md` (to be created next)

If any AI-generated suggestion conflicts with these docs, the docs win.

---

## Future Architecture Improvements

### Scalability
- Consider implementing GraphQL API layer for more efficient data fetching and reduced over-fetching.
- Add Redis caching for frequently accessed data (user profiles, squad stats).
- Implement database read replicas for read-heavy operations.
- Use CDN for static assets and media files.

### Security
- Implement proper JWT validation on all API routes requiring authentication.
- Add rate limiting per user/IP for all endpoints.
- Use Row Level Security (RLS) in Supabase for additional data access control.
- Implement audit logging for sensitive operations.

### Maintainability
- Add comprehensive error monitoring (e.g., Sentry).
- Implement automated testing for critical paths.
- Add API versioning strategy.
- Document all API endpoints with OpenAPI/Swagger.

### Performance
- Optimize database queries with proper indexing.
- Implement lazy loading for large lists (messages, leaderboards).
- Add compression for API responses.
- Use WebSockets efficiently with room-based messaging.
