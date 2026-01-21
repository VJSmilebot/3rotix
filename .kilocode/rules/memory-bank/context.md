# 3ROTIX Context

## Current Work Focus

**Phase 2: API Foundation In Progress (27+ routes gated)**
- Systematically fixing API routes to use `withAuth` wrapper
- Removing ad-hoc Supabase clients with service role keys (security fixes)
- Standardizing response shapes to `{ok: true, data: ...}` or `{ok: false, error: "..."}`
- Build passes with only pre-existing `requireAdmin` warning

## Completed Phases

### Phase 0: Pre-Flight Inventory Complete
- Read all source of truth documents (ARCHITECTURE.md, AI_RULES.md, XP_TRIGGERS.md)
- Created comprehensive INVENTORY.md mapping routes, APIs, models, and modules
- Identified canonical vs duplicate files
- Documented conflicts between code and source of truth

### Phase 1: Architecture + Database Consistency
- Verified Prisma singleton in lib/prisma.js
- Confirmed schema is PUBLIC-only
- Build validates Prisma client

## Recent Changes (Phase 2)

### Fixed API Routes (27+ total):

**Chat Routes:**
- `pages/api/chat/[squadId]/reactions.js` - Added withAuth, derive userId from session
- `pages/api/chat/track-xp.js` - Added withAuth, standardized error responses
- `pages/api/chat/[squadId]/edit.js` - Replaced ad-hoc Supabase with withAuth

**Bundle Routes:**
- `pages/api/bundles/by-creator/[creatorId].js` - Added withAuth, standardized response

**Messages Routes:**
- `pages/api/messages/conversation/[conversationId].js` - Fixed import paths, standardized response
- `pages/api/messages/send.js` - Removed service role key, use withAuth
- `pages/api/messages/create.js` - Removed service role key, use withAuth

**User Routes:**
- `pages/api/user/update.js` - Added withAuth, standardized response
- `pages/api/user/profile.js` - Public endpoint (intentional), standardized response
- `pages/api/user/overview.js` - Fixed inconsistent error responses
- `pages/api/user/ensure.js` - No auth (intentional for profile auto-provision), standardized response

**Financial Routes (Security Critical):**
- `pages/api/withdraw/request.js` - Standardized response shape
- `pages/api/tips/send.js` - Removed service role key, use withAuth
- `pages/api/subscriptions/subscribe.js` - Removed service role key, use withAuth

**Content Creation Routes:**
- `pages/api/posts/create.js` - Added withAuth, removed ad-hoc client
- `pages/api/events/create.js` - Removed service role key, use withAuth
- `pages/api/images/create.js` - Removed service role key, use withAuth
- `pages/api/videos/create.js` - Removed service role key, use withAuth
- `pages/api/lipz/buy.js` - Removed service role key, use withAuth
- `pages/api/custom-requests/create.js` - Removed service role key, use withAuth

## Known Issues (Not Yet Fixed)

- `pages/api/admin/squad-create.js` - requires `requireAdmin` export from auth-middleware.js
- Remaining API routes still need auth gates (~40 total)
- XP writes outside lib/xp.js (api/squads.js, pages/api/squads/create.js)
- Duplicate lib/supabaseClient.js
- Test pages in pages/ directory

## Technical Debt Notes

- api/squads.js is in wrong location (should be pages/api/)
- Response shapes mostly standardized now
- Some admin routes need requireAdmin helper

## Next Steps

1. Finish Phase 2: Gate remaining API routes
2. Phase 3: Auth + Profile Lifecycle verification
3. Phase 4: Core User Flows (onboarding, squads, chat)
4. Phase 5: XP Ready verification
5. Phase 6: Deployment readiness
