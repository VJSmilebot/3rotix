# 3ROTIX MVP Readiness Checklist

## Overall Status: NOT READY

## Phase 0: Pre-Flight Inventory
- [x] Read source of truth documents
- [x] Complete repository inventory
- [x] Identify conflicts and drift

## Phase 1: Architecture + Database Consistency ✅ COMPLETED
- [x] Verify env variables are used correctly
- [x] Confirm Prisma schema matches DB needs
- [x] Ensure single Prisma singleton
- [x] No migrations - schema changes via Supabase SQL

### Phase 1 Changes Made
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `directUrl = env("DIRECT_URL")` to datasource block |
| `.env.example` | Created with all required environment variables |

### Phase 1 Validation
- ✅ `prisma generate` succeeded
- ✅ Prisma singleton at `lib/prisma.js` verified correct
- ✅ Supabase clients verified (lib/supabaseAdmin.js, utils/supabase/server.js, utils/supabase/client.js)
- ✅ Service role key protected (server-only)
- ✅ No Prisma migrations needed

### Env Variables Verified
| Variable | Location | Status |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients | ✅ Correct |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase clients | ✅ Correct |
| `SUPABASE_SERVICE_ROLE_KEY` | lib/supabaseAdmin.js | ✅ Server-only |
| `DATABASE_URL` | Prisma schema | ✅ Used |
| `DIRECT_URL` | Prisma schema | ✅ Added |
| `XP_ENABLED` | lib/xp.js | ✅ Flag exists |

## Phase 2: API Foundation (IN PROGRESS)
- [ ] All API routes use requireAuth/requireAdmin
- [ ] All API routes use canonical Supabase server client
- [ ] No ad-hoc Supabase clients in API routes
- [ ] Standardized error handling + response shapes

### Phase 2 Changes Made
| File | Issues Fixed |
|------|-------------|
| `pages/api/bundles/[bundleId].js` | Removed ad-hoc Supabase client with service role key, added `withAuth` wrapper, standardized response shapes |
| `pages/api/bundles/create.js` | Removed ad-hoc Supabase client with service role key, added `withAuth` wrapper, standardized response shapes |
| `pages/api/audio.js` | Removed ad-hoc Supabase client, rewrote to use Prisma instead of Supabase query builder, added `withAuth` wrapper |

### Phase 2 Remaining Work
| Priority | Route | Issues |
|----------|-------|--------|
| CRITICAL | `pages/api/videos.js` | Ad-hoc Supabase client, no auth |
| CRITICAL | `pages/api/images.js` | Ad-hoc Supabase client, no auth |
| HIGH | `pages/api/chat/[squadId].js` | Response shape inconsistency |
| HIGH | `pages/api/admin/onboarding/steps.js` | Duplicate `requireAdmin` function |
| MEDIUM | Other 45+ routes | Ad-hoc Supabase clients, response shape fixes |

## Phase 3: Auth + Profile Lifecycle
- [ ] Middleware only proxies session (Edge-safe)
- [ ] AuthContext is canonical client auth consumer
- [ ] Profile existence auto-provision works
- [ ] Roles come from Prisma public.User.role

## Phase 4: Core User Flows
- [ ] Onboarding: sign in -> ensure profile -> profile page
- [ ] Squads: list, view, join, leave, memberCount
- [ ] Chat/DM: send/read messages
- [ ] Creator/Fan portals render correctly

## Phase 5: XP Ready (but OFF)
- [ ] All XP writes go through lib/xp.js only
- [ ] XP_ENABLED flag pattern implemented
- [ ] Idempotency keys on all XP awards
- [ ] No features depend on XP being on

## Phase 6: Deployment Readiness
- [ ] Next.js build passes
- [ ] Environment documented (.env.example)
- [ ] No secrets exposed to browser
- [ ] All pages have default exports

## TOP 10 BLOCKERS (MVP-CRITICAL)

| Priority | Blocker | Status |
|----------|---------|--------|
| 1 | **API Routes Without Auth** | ⚠️ PARTIALLY FIXED - 4/15+ routes fixed |
| 2 | **Ad-hoc Supabase Clients** | ⚠️ PARTIALLY FIXED - 3/50+ files fixed |
| 3 | **Direct XP Writes** | ❌ NOT YET FIXED - api/squads.js, pages/api/squads/create.js |
| 4 | **XP Idempotency Violation** | ❌ NOT YET FIXED - api/squads.js |
| 5 | **Duplicate requireAdmin** | ✅ FIXED - pages/api/admin/onboarding/steps.js |
| 6 | **Response Shape Inconsistent** | ⚠️ PARTIALLY FIXED - Fixed routes use { ok: true/false } |
| 7 | **Duplicate lib/supabaseClient.js** | ❌ NOT YET FIXED |
| 8 | **Admin Role Check Inconsistency** | ❌ NOT YET FIXED |
| 9 | **XPActionType Enum Missing** | ✅ ALREADY EXISTS - SQUAD_CREATE is in enum |
| 10 | **Test Pages in pages/** | ❌ NOT YET FIXED |

## Detailed Blocker Breakdown

### CRITICAL (Must Fix Before MVP)

#### Blocker 1: 15+ API Routes Without Auth
**Files:**
- `pages/api/bundles/[bundleId].js` - No auth, ad-hoc Supabase client with service role key
- `pages/api/bundles/create.js` - No auth, ad-hoc Supabase client
- `pages/api/audio.js` - No auth, ad-hoc Supabase client
- `pages/api/videos.js` - No auth, ad-hoc Supabase client
- `pages/api/images.js` - No auth, ad-hoc Supabase client
- `pages/api/leaderboard.js` - No auth
- `pages/api/support-intent.js` - Uses `getSupabaseUser` but no consistent wrapper
- Plus 8+ more routes in `pages/api/messages/*`, `pages/api/wallet/*`, `pages/api/subscriptions/*`

**Fix:** Apply `withAuth()` wrapper from `lib/auth-middleware.js` to all protected routes.

#### Blocker 2: 50+ Ad-hoc Supabase Clients
**Pattern to fix:**
```javascript
// BAD - Don't do this
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// GOOD - Use canonical
import { createSupabaseServerClient } from '../../utils/supabase/server.js';
const supabase = createSupabaseServerClient({ req, res });
```

**Fix:** Replace all ad-hoc `createClient()` calls with canonical server client.

#### Blocker 3: Direct XP Writes Outside lib/xp.js
**Files:**
- `pages/api/squads/create.js:71-85` - Direct `xPLog.create()` + User update
- `api/squads.js:102-109` - Direct `xPLog.create()` without idempotency

**Fix:** Use `awardXP()` from `lib/xp.js` which handles idempotency and transaction safety.

### HIGH (Should Fix Before MVP)

#### Blocker 4: XP Idempotency Violation
**File:** `api/squads.js:102-109`
```javascript
// BAD - No idempotencyKey
await prisma.xPLog.create({ data: { userId, xpValue: 50, actionType: "SQUAD_JOIN" } });

// GOOD - With idempotencyKey
await awardXP({ userId, actionType: "SQUAD_JOIN", xpValue: 50, idempotencyKey: `squad_join:${userId}:${squadId}` });
```

#### Blocker 5: Duplicate requireAdmin
**File:** `pages/api/admin/onboarding/steps.js:5`
```javascript
// BAD - Local duplicate
async function requireAdmin(req, res) { ... }

// GOOD - Import from canonical
import { requireAdmin } from '../../../lib/auth.js';
```

### MEDIUM (Nice to Have)

#### Blocker 7: Duplicate lib/supabaseClient.js
**File:** `lib/supabaseClient.js`
Just delegates to `utils/supabase/client.js` - redundant, should be deleted.

#### Blocker 8: Admin Role Inconsistency
`lib/admin.js:4` checks `role !== "MOD"` but `lib/auth.js:84` checks `isSuperAdmin || role === "ADMIN"` - should align.

### LOW (Post-MVP)

#### Blocker 9: Missing XPActionType Enum Values
Add `SQUAD_CREATE` and `SQUAD_LEVEL_UP` to the enum in `prisma/schema.prisma`.

#### Blocker 10: Test Files in pages/
Move `3ROTIXS.txt` and `jsconfig.json` out of `pages/` directory.

## What's Been Done
- Created comprehensive INVENTORY.md mapping routes, APIs, models, and modules
- Identified all canonical vs duplicate files
- Documented conflicts between code and source of truth

## What's NOT Been Changed
- No code modifications yet (Phase 0 only)
- All findings are documented for Phase 1+ implementation
