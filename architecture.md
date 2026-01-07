# 3ROTIX Canonical Stack Architecture

**Version:** 1.6 (Final)  
**Date:** 2026-01-06  
**Status:** Source of Truth

---

## Version Pinning

**CRITICAL:** This architecture pins exact versions. Do not upgrade without updating this document.

| Package | Pinned Version | Placement | Reason |
|---------|---------------|-----------|--------|
| prisma | 6.19.1 | devDependencies | CLI tool only |
| @prisma/client | 6.19.1 | dependencies | Runtime client |
| @supabase/ssr | 0.6.1 | dependencies | SSR auth |
| @supabase/supabase-js | 2.56.1 | dependencies | Supabase client |
| next | 13.4.19 | dependencies | Pages Router |
| pnpm | (see lockfile) | - | Package manager |

**To upgrade safely (exact versions only):**
```bash
pnpm add -D prisma@6.19.1 --save-exact
pnpm add @prisma/client@6.19.1 --save-exact
```

**Alternative:** Create `.npmrc` with `save-exact=true` to enforce exact versions globally.

**Lockfile:** Commit `pnpm-lock.yaml`. Never delete or ignore it.

---

## Authority Sources (Single Source of Truth)

| Aspect | Source | Notes |
|--------|--------|-------|
| **Identity** | `auth.users.id` from Supabase | User's UUID |
| **Session validity (standard)** | `getUser()` | Validates session |
| **Session validity (elevated)** | `getClaims()` | Verifies JWT signature |
| **Authorization (roles)** | `public.User.role` from Prisma | Admin/Mod roles |
| **Data access (browser)** | RLS policies | Supabase client access |
| **Profile existence** | `public.User` must exist | Auto-provisioned on first auth |

**Key Principle:** Identity comes from Supabase Auth. Authorization comes from Prisma User.role. Profile must exist before use.

---

## 1. Canonical Stack Decision

### Auth Strategy: Supabase Auth + Prisma User Profile (Option A)

**Chosen Approach:** Supabase Auth is the sole authentication system. Prisma manages the `public` schema only. NextAuth is forbidden.

**Security Levels:**
- **Standard routes:** `getUser()` for auth gate + Prisma User.role for authorization
- **Elevated security routes** (admin, payouts, moderation): `getClaims()` for JWT verification + Prisma User.role

**Sources:**
- [Supabase Auth Docs - SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Supabase SSR Package](https://www.npmjs.com/package/@supabase/ssr)
- [Prisma on Vercel Serverless](https://www.prisma.io/docs/guides/database/serverless)

---

## 2. Folder/File Conventions

```
3rotixp/
├── lib/
│   ├── prisma.js              # Prisma client singleton
│   ├── auth.js                # Server auth helpers (getUser, getClaims)
│   ├── auth-middleware.js     # requireAuth() + requireAdmin() wrappers
│   ├── supabaseAdmin.js       # Service role client (ADMIN ONLY)
│   └── xp.js                  # XP awarding logic (canonical)
├── utils/
│   └── supabase/
│       ├── client.js          # Browser client (getSupabaseClient)
│       └── server.js          # Server client (createSupabaseServerClient)
├── context/
│   └── AuthContext.js         # React auth context (consumer only)
├── middleware.js              # Session proxy using updateSession()
├── prisma/
│   └── schema.prisma          # Data models (public schema ONLY)
└── pages/
    ├── api/
    │   └── (all routes use lib/auth-middleware.js)
    └── _app.js                # Wraps with AuthProvider
```

### File Responsibilities

| File | Purpose | Don't Do |
|------|---------|----------|
| `lib/prisma.js` | Global Prisma singleton | Create other Prisma instances |
| `lib/auth.js` | Server auth verification | Duplicate auth logic in API routes |
| `lib/auth-middleware.js` | API route auth wrappers | Skip auth in routes |
| `utils/supabase/client.js` | Browser Supabase client | Create ad-hoc Supabase clients elsewhere (or call this on the server) |
| `utils/supabase/server.js` | Server Supabase client | Create ad-hoc clients in API routes |
| `middleware.js` | Session proxy (updateSession) | Use as auth enforcer for APIs |
| `lib/xp.js` | Only place for XP writes | Award XP directly anywhere else |

---

## 3. Prisma Schema Policy (PUBLIC-ONLY)

**Non-Negotiable Rules:**

1. **Prisma is public-first.** Only models in the `public` schema.
2. **No auth schema.** User identity comes from Supabase Auth; Prisma stores extended profile data only.
3. **No writes to auth tables.** Reconciliation is one-way: `auth.users` → `public.user`.
4. **No Prisma migrations.** Schema changes via Supabase SQL → `prisma db pull` → `prisma generate`.
5. **No `prisma migrate deploy`.** Never run migration deploy in CI/production.

**User Existence Rule:**
- On first authenticated request, ensure a matching row exists in `public.user`
- This is handled by `pages/api/user/ensure.js` or equivalent auto-provisioning

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For CLI operations (direct DB connection)
}

// All models use @@schema("public") or default
model User {
  id                                      String   @id
  email                                   String   @unique
  role                                    Role     @default(FAN)
  totalXp                                 Int      @default(0)
  rank                                    Rank     @default(ROOKIE)
  // ... extended profile fields only
}
```

---

## 4. Runtime Rules

| Runtime | Host | Prisma Allowed | Auth Strategy |
|---------|------|----------------|---------------|
| **Middleware** | Edge | NO - Prisma import fails | `updateSession()` proxy (page routes only) |
| **API Routes** | Node.js | YES | `requireAuth()` or `requireAdmin()` wrapper (supports token refresh) |
| **getServerSideProps** | Node.js | YES | `getSupabaseUser()` |
| **Client Components** | Browser | NO | `useAuth()` context |

**Middleware Note:** Middleware intentionally does not run on `/api/*`. API auth is enforced by `requireAuth()`/`requireAdmin()` wrappers, which use the SSR server client that supports cookie refresh on responses.

**Key Principle:** Middleware only proxies sessions for page routes. API routes handle their own auth with session refresh capability.

---

## 5. Database Connection

### Environment Variables

```bash
# Runtime (Vercel) - Supavisor Session Pooler
DATABASE_URL="postgres://prisma.abcdefghijk:password@us-east-1.pooler.supabase.com:5432/postgres"

# CLI/Introspection - Required for this repo's workflow
# We want CLI commands (db pull, generate) to use direct DB connection
DIRECT_URL="postgres://postgres:password@db.abcdefghijk.supabase.co:5432/postgres"

# Admin (server-side ONLY - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase URL + Anon Key (client + server)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Connection Details:**
- Port **5432** = Session mode (correct for Prisma)
- Port **6543** = Transaction mode (not recommended for Prisma)
- DIRECT_URL is used by CLI commands to connect directly (bypassing pooler)
- [Supabase Prisma Guide](https://supabase.com/docs/guides/database/prisma)
- [Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq)

---

## 6. Auth Flow

### Middleware Session Proxy

```javascript
// middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, options })
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Proxy/update session - refreshes tokens and syncs cookies
  await supabase.auth.updateSession()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

### API Route Auth (Standard + Elevated)

```javascript
// lib/auth.js
import { createSupabaseServerClient } from "../utils/supabase/server.js";
import { prisma } from "./prisma.js";

// Standard auth gate (sufficient for most routes)
export async function getSupabaseUser(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { email: user.email ?? "" }] },
      select: { id: true, email: true, role: true },
    });
    return dbUser || null;
  } catch {
    return null;
  }
}

// Elevated security: verify JWT signature + authorize via Prisma role
// getClaims() is for VERIFICATION ONLY - do not read "admin" from claims
// Authorization must come from public.User.role
export async function verifyElevatedAccess(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);
    
    // Verify JWT signature against JWKS
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    const { data: { claims } } = await supabase.auth.getClaims();
    
    // Get Prisma user for role-based AUTHORIZATION
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true },
    });
    
    return { supabaseUser: user, claims, dbUser };
  } catch {
    return null;
  }
}

// lib/auth-middleware.js
import { getSupabaseUser, verifyElevatedAccess } from "./auth.js";

// Standard auth - requires authenticated user
export function requireAuth(handler) {
  return async (req, res) => {
    const user = await getSupabaseUser(req, res);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    return handler(req, res);
  };
}

// Elevated auth - requires admin role from Prisma (NOT from JWT claims)
export function requireAdmin(handler) {
  return async (req, res) => {
    const { dbUser } = await verifyElevatedAccess(req, res) || {};
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = dbUser;
    return handler(req, res);
  };
}
```

---

## 7. Request Lifecycle Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant API_Route
    participant Supabase_Auth
    participant Prisma
    participant Database

    Note over Browser: Supabase auth cookies managed by @supabase/ssr
    
    Browser->>Middleware: Page Request (+ cookies)
    Note over Middleware: updateSession() proxy - refresh tokens
    Note over Middleware: Middleware does NOT run on /api/*
    
    alt Page Request
        Middleware->>Browser: Rendered page
    else API Request
        Browser->>API_Route: API fetch (+ cookies)
        Note over API_Route: requireAuth() or requireAdmin() wrapper
        Note over API_Route: Server client supports cookie refresh on response
        
        alt Standard Route
            API_Route->>Supabase_Auth: getUser()
            Supabase_Auth-->>API_Route: Session user
            API_Route->>Prisma: Check User.role
        else Elevated Route (Admin)
            API_Route->>Supabase_Auth: getUser() + getClaims()
            Supabase_Auth-->>API_Route: Verified JWT + claims
            Note over API_Route: getClaims() = verification only
            API_Route->>Prisma: Check User.role === 'ADMIN'
        end
    end

    Note over API_Route: User authorized, ensure profile exists in Prisma
    
    API_Route->>Prisma: DB operations in $transaction
    Prisma->>Database: Atomic writes
    
    Database-->>Prisma: Commit confirmation
    Prisma-->>API_Route: Result
    API_Route-->>Browser: JSON response (with refreshed cookies if needed)
```

---

## 8. XP System Spec

### Tables

```prisma
model User {
  id                                      String   @id
  email                                   String   @unique
  role                                    Role     @default(FAN)
  totalXp                                 Int      @default(0)
  rank                                    Rank     @default(ROOKIE)
  // ... extended profile fields
}

model XPLog {
  id             String       @id @default(uuid())
  userId         String
  xpValue        Int
  actionType     XPActionType
  refId          String?      // Context reference
  idempotencyKey String       // NON-NULLABLE - required for all awards
  ipHash         String?      // For abuse detection
  userAgent      String?
  createdAt      DateTime     @default(now())

  @@unique([userId, idempotencyKey])
  @@index([userId, createdAt])
}
```

### Concurrency-Safe Idempotency Pattern

```javascript
// lib/xp.js - Race-condition safe
async function awardXP({
  userId,
  actionType,
  xpValue,
  refId = null,
  idempotencyKey,  // REQUIRED - non-nullable
  ipHash = null,
  userAgent = null,
}) {
  if (!idempotencyKey) {
    throw new Error("idempotencyKey is required for all XP awards");
  }

  return prisma.$transaction(async (tx) => {
    // Step 1: Try to create XPLog FIRST (with unique constraint)
    let xpLog;
    try {
      xpLog = await tx.xPLog.create({
        data: {
          userId,
          xpValue,
          actionType,
          refId,
          idempotencyKey,
          ipHash,
          userAgent,
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        xpLog = await tx.xPLog.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey } }
        });
        return { ok: true, duplicate: true, rankUp: false, xpLog };
      }
      throw error;
    }

    // Step 2: Update user XP
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { totalXp: { increment: xpValue } },
    });

    // Step 3: Check rank-up
    const newRank = computeRank(updatedUser.totalXp);
    let rankUp = false;
    if (newRank !== updatedUser.rank) {
      await tx.user.update({
        where: { id: userId },
        data: { rank: newRank },
      });
      rankUp = true;
    }

    return { ok: true, duplicate: false, rankUp, xpLog };
  });
}
```

### Idempotency Key Formats

| Action Type | Format |
|-------------|--------|
| CHAT_MESSAGE | `chat:{messageId}` |
| JOIN_SQUAD | `squad-join:{userId}:{squadId}` |
| PROFILE_CREATED | `profile-created:{userId}` |
| ACHIEVEMENT_UNLOCK | `achievement:{userId}:{achievementSlug}` |
| ADMIN_GRANT | `admin-grant:{userId}:{adminId}:{timestamp}` |

---

## 9. Security Checklist (Non-Negotiables)

### DO

- [ ] Use `lib/auth-middleware.js` `requireAuth()` for all API route auth
- [ ] Use `requireAdmin()` for elevated security routes (verify JWT + Prisma role)
- [ ] Wrap all XP awards in `prisma.$transaction`
- [ ] Require `idempotencyKey` for every XP award (non-nullable)
- [ ] Hash IPs before storing (`sha256(ip + salt)`)
- [ ] Use service role key ONLY in `lib/supabaseAdmin.js`
- [ ] Set RLS policies on all tables for Supabase client access
- [ ] Use `@supabase/ssr` for all auth
- [ ] Ensure Prisma user profile exists on first authenticated request
- [ ] Commit `pnpm-lock.yaml`

### DON'T

- [ ] NEVER use Supabase service role in browser code
- [ ] NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client
- [ ] NEVER award XP without idempotency key
- [ ] NEVER bypass Prisma transaction for multi-table writes
- [ ] NEVER store raw IPs (must hash)
- [ ] NEVER use `getServerSession` or NextAuth
- [ ] NEVER create multiple Prisma client instances
- [ ] NEVER use middleware as auth enforcer for API routes
- [ ] NEVER use `prisma migrate dev` or `prisma migrate deploy`
- [ ] NEVER include auth schema in Prisma (public-only)
- [ ] NEVER rely on JWT claims for authorization (use Prisma User.role)
- [ ] NEVER upgrade Prisma past v6 without updating this document

---

## 10. Migration Plan

### Non-Negotiable Rules

1. **No `prisma migrate dev`** - Schema changes via Supabase SQL
2. **No `prisma migrate deploy`** - Never run in CI/production
3. **Workflow:** Supabase SQL → `npx prisma db pull` → `npx prisma generate`

### Phase 1: Audit & Baseline (Day 1)

1. [ ] Run `grep -r "createBrowserClient\|createServerClient" --include="*.js" | grep -v "utils/supabase"`
2. [ ] Run `grep -r "PrismaClient" --include="*.js" | grep -v "lib/prisma.js"`
3. [ ] List all API routes that call Prisma directly (skip auth check)
4. [ ] Document all XP awarding locations (not via `lib/xp.js`)

### Phase 2: Update Environment Variables (Day 2)

1. [ ] Get pooler connection string from Supabase Dashboard
2. [ ] Update `.env`:
   ```bash
   DATABASE_URL="postgres://prisma.[PROJECT-REF]:password@[REGION].pooler.supabase.com:5432/postgres"
   DIRECT_URL="postgres://postgres:password@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
3. [ ] Run `npx prisma db pull` to sync schema

### Phase 3: Consolidate Supabase Clients (Day 3)

1. [ ] Delete any duplicate client files (keep `utils/supabase/client.js` + `server.js`)
2. [ ] Redirect all imports to `utils/supabase/*`

### Phase 4: Fix Auth Flow (Day 4)

1. [ ] Update `middleware.js` to use `updateSession()` proxy
2. [ ] Create `lib/auth-middleware.js` with `requireAuth()` and `requireAdmin()`
3. [ ] Update all API routes to use appropriate wrapper

### Phase 5: Fix XP Idempotency (Day 5)

1. [ ] Update `prisma/schema.prisma`: make `idempotencyKey` non-nullable
2. [ ] Update `lib/xp.js` with concurrency-safe pattern
3. [ ] Run `npx prisma db pull` to sync

### Phase 6: Security Hardening (Day 6)

1. [ ] Create RLS policies for all tables
2. [ ] Add audit logging for admin actions
3. [ ] Verify service role is never used in API routes

### Phase 7: Testing & Documentation (Day 7)

1. [ ] Test login → profile creation → chat → XP award
2. [ ] Test concurrency: two requests, only one XP awarded
3. [ ] Verify idempotency: refresh, XP not doubled

---

## 11. Common Failure Modes & Fixes

| Failure Mode | Cause | Fix |
|--------------|-------|-----|
| XP doubled on refresh | Missing idempotency key | Make non-nullable in schema |
| XP doubled on concurrent requests | Check-then-update | Create XPLog first, catch P2002 |
| Prisma connection exhausted | Too many clients | Global singleton in `lib/prisma.js` |
| Auth state lost on refresh | Middleware not proxying | Use `updateSession()` |
| RLS blocking reads | Policy incorrect | Check `auth.uid()` matches |
| Admin route accessed by user | Wrong authorization source | Use Prisma User.role, not JWT claims |
| Stale token on long API session | Middleware doesn't run on /api | Server client supports refresh |
| PgBouncer errors | Transaction mode | Use session mode (5432) |
| Prisma upgrade broke config | No version pin | Stay on v6, document explicitly |

---

## 12. Sources & References

1. [Supabase Auth - Server-Side Rendering](https://supabase.com/docs/guides/auth/server-side-rendering)
2. [Supabase SSR Package](https://www.npmjs.com/package/@supabase/ssr)
3. [Supabase - Prisma Guide](https://supabase.com/docs/guides/database/prisma)
4. [Supabase - Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq)
5. [Supabase - Get Claims](https://supabase.com/docs/reference/javascript/auth-getclaims)
6. [Prisma - Serverless Deployments](https://www.prisma.io/docs/guides/database/serverless)
7. [Prisma - Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
8. [Prisma - PgBouncer](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer)
9. [Prisma v7 Breaking Changes](https://github.com/prisma/prisma/issues/28573)
10. [Vercel - Serverless Functions Best Practices](https://vercel.com/docs/concepts/functions/serverless-functions#managing-connections)

---

**This document is the source of truth. All code changes must align with these patterns.**

---

## Changelog

### v1.6 (2026-01-06) - FINAL FINAL FINAL

- Added API route token refresh note (middleware doesn't run on /api/*, but wrappers support refresh)
- Softened DIRECT_URL wording: "required for this repo's workflow" (not inherent requirement)
- Tightened admin authorization wording: "getClaims() is for VERIFICATION ONLY"
- Added Profile existence to Authority Sources table
- Added "don't run prisma migrate deploy" to Prisma Schema Policy
- Updated Runtime Rules table: API routes support token refresh

### v1.5 (2026-01-06)

- Added --save-exact to upgrade commands
- Fixed admin check: uses Prisma User.role (not JWT claims.role)
- Fixed Runtime Rules table header
- Clarified DIRECT_URL is required for CLI operations
- Added middleware matcher note
- Added Authority Sources section

### v1.4 (2026-01-06)

- Public-only Prisma - removed auth schema
- Package manager truth - pnpm + lockfile commitment
- Dependency placement - prisma in devDependencies, client in dependencies
- User existence rule - profile must exist on first auth
- Elevated security routes - getUser() standard, getClaims() for admin

### v1.3 (2026-01-06)

- Pinned exact Prisma versions (6.19.1, no caret)
- Removed getClaims() claim - document uses standard getUser() pattern
