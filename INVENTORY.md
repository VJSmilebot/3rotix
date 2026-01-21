# 3ROTIX Repository Inventory

## 1. Source of Truth Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Master specification for system architecture | Active |
| [AI_RULES.md](AI_RULES.md) | AI/agent rules and guidelines | Active |
| [XP_TRIGGERS.md](XP_TRIGGERS.md) | XP trigger definitions and specifications | Active |
| [.kilocode/rules/](.kilocode/rules/) | Operational rules directory | Active |

---

## 2. Pages Router Structure

### Public Pages (No Auth Required)

| Page | Path | Notes |
|------|------|-------|
| Home | `pages/index.js` | Landing page |
| About | `pages/about.js` | Static |
| Blog | `pages/blog.js` | Static |
| Build | `pages/build.js` | Static |
| Contact | `pages/contact.js` | Static |
| Education | `pages/education.js` | Static |
| Events | `pages/events.js` | Static |
| FAQ | `pages/faq.js` | Static |
| Features | `pages/features.js` | Static |
| Gamification | `pages/gamification.js` | Static |
| Impact | `pages/impact.js` | Static |
| Join | `pages/join.js` | Auth entry point |
| LegalHub | `pages/legalhub.js` | Static |
| Login | `pages/login.js` | Auth entry point |
| Market | `pages/market.js` | Static |
| Pricing | `pages/pricing.js` | Static |
| Reset | `pages/reset.js` | Password reset |
| Roadmap | `pages/roadmap.js` | Static |
| Streaming | `pages/streaming.js` | Static |
| Support | `pages/support.js` | Static |
| Tools | `pages/tools.js` | Static |
| Waitlist | `pages/waitlist.js` | Static |
| 3D | `pages/3d.js` | 3D viewer |
| Demo Rankup | `pages/demo-rankup.js` | XP demo |
| Test | `pages/test.js` | Testing page |

### Protected Pages (Auth Required)

| Page | Path | Auth Gate |
|------|------|-----------|
| Dashboard | `pages/dashboard.js` | Expected auth |
| Me | `pages/me.js` | Profile page |
| Studio | `pages/studio.js` | Creator studio |
| Homebase | `pages/homebase.js` | User homebase |
| Media | `pages/media.js` | User media |
| My Subscriptions | `pages/my-subscriptions.js` | User subs |
| Your Bag | `pages/your-bag.js` | User bag |
| Creator Portal | `pages/creator-portal.js` | Creator tools |
| Fan Portal | `pages/fan-portal.js` | Fan tools |
| Platform | `pages/platform.js` | Platform tools |
| Leaderboard | `pages/leaderboard.js` | XP leaderboard |
| Vault | `pages/vault.js` | User vault |

### Admin Pages

| Page | Path | Notes |
|------|------|-------|
| Admin Index | `pages/admin/index.js` | Admin dashboard |

### Dynamic Routes

| Route | Path | Notes |
|-------|------|-------|
| User Profile | `pages/[username].js` | Dynamic username |
| Playback | `pages/[playbackId].js` | Component with dynamic ID |

---

## 3. API Routes Inventory

### Auth-Gated Routes (Using requireAuth/requireAdmin/withAuth)

| Route | File | Auth Method |
|-------|------|-------------|
| Admin Award XP | `pages/api/admin/award-xp.js` | requireAdmin |
| Admin Badge Issue | `pages/api/admin/badge-issue.js` | requireAdmin |
| Admin Content Create | `pages/api/admin/content-create.js` | requireAdmin |
| Admin Profile Upsert | `pages/api/admin/profile-upsert.js` | requireAdmin |
| Admin Squad Create | `pages/api/admin/squad-create.js` | requireAdmin |
| Admin Onboarding Config | `pages/api/admin/onboarding/config.js` | requireAdmin (local) |
| Admin Onboarding Steps | `pages/api/admin/onboarding/steps.js` | requireAdmin (local) |
| Squad Join | `pages/api/squads/[squadId]/join.js` | requireAuth |
| Chat Track XP | `pages/api/chat/track-xp.js` | requireAuth |

### Routes Missing Auth (CRITICAL)

| Route | File | Risk Level |
|-------|------|------------|
| Audio Create | `pages/api/audio/create.js` | **HIGH** - Creates resources |
| Audio Update Playback | `pages/api/audio/update-playback.js` | MEDIUM |
| Images | `pages/api/images.js` | **HIGH** - File upload |
| Videos | `pages/api/videos.js` | **HIGH** - File upload |
| Bundles All | `pages/api/bundles/all.js` | MEDIUM |
| Bundles Create | `pages/api/bundles/create.js` | **HIGH** - Creates bundles |
| Bundles By Creator | `pages/api/bundles/by-creator/[creatorId].js` | MEDIUM |
| Chat [squadId] | `pages/api/chat/[squadId].js` | MEDIUM |
| Chat Edit | `pages/api/chat/[squadId]/edit.js` | MEDIUM |
| Chat Reactions | `pages/api/chat/[squadId]/reactions.js` | MEDIUM |
| Custom Requests Create | `pages/api/custom-requests/create.js` | MEDIUM |
| Leaderboard | `pages/api/leaderboard.js` | LOW |
| Debug DB | `pages/api/debug-db.js` | **CRITICAL** - Debug only |
| Debug Env | `pages/api/debug-env.js` | **CRITICAL** - Secrets exposure |
| Support Intent | `pages/api/support-intent.js` | LOW |
| Test Hash | `pages/api/test-hash.js` | DEBUG |

### Ad-hoc Client Creation Violations (50+ Files)

| Category | Files |
|----------|-------|
| Audio | `pages/api/audio.js`, `pages/api/audio/create.js`, `pages/api/audio/update-playback.js` |
| Images | `pages/api/images.js` |
| Videos | `pages/api/videos.js` |
| Messages | `pages/api/messages/*` |
| Chat | `pages/api/chat/*` |
| Bundles | `pages/api/bundles/*` |

---

## 4. Auth System

### Auth Wrappers

| Wrapper | File | Status |
|---------|------|--------|
| `requireAuth()` | `lib/auth-middleware.js` | Canonical |
| `requireAdmin()` | `lib/auth-middleware.js` | Canonical |
| `withAuth()` | `lib/auth.js` | Legacy |
| `getSupabaseUser()` | `lib/auth.js` | Helper |

### Auth Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/auth-middleware.js` | API route middleware | **CANONICAL** |
| `lib/auth.js` | Server auth helpers | **CANONICAL** |
| `middleware.js` | Edge middleware for session | **CANONICAL** |
| `context/AuthContext.js` | Client auth context | **CANONICAL** |

### Duplicate/Conflicting Auth

| File | Issue |
|------|-------|
| `pages/api/admin/onboarding/steps.js` | Local `requireAdmin` implementation - duplicates canonical |

---

## 5. Supabase Clients

### Canonical Files

| File | Type | Purpose |
|------|------|---------|
| `lib/supabaseAdmin.js` | Service Role | Server-only admin operations |
| `utils/supabase/client.js` | Browser Client | Client-side Supabase |
| `utils/supabase/server.js` | Server Client | SSR/API server operations |

### Duplicate Files

| File | Issue | Recommendation |
|------|-------|----------------|
| `lib/supabaseClient.js` | Wrapper duplicating canonical | **REMOVE** - causes confusion |

### Ad-hoc Client Violations

Files creating `createClient()` directly instead of using canonical clients:
- `pages/api/audio.js`
- `pages/api/videos.js`
- `pages/api/images.js`
- `pages/api/messages/*`
- `pages/api/chat/*`
- Multiple bundle routes

---

## 6. Prisma Client

| File | Purpose | Status |
|------|---------|--------|
| `lib/prisma.js` | Singleton PrismaClient | **CANONICAL** - Correct |

---

## 7. Database Models (Prisma Schema)

### Models

| Model | File | Notes |
|-------|------|-------|
| User | `prisma/schema.prisma` | Core user model |
| Squad | `prisma/schema.prisma` | Squad/team model |
| SquadMember | `prisma/schema.prisma` | Squad membership |
| ChatMessage | `prisma/schema.prisma` | Chat messages |
| XPLog | `prisma/schema.prisma` | XP audit log |
| Achievement | `prisma/schema.prisma` | Achievement definitions |
| UserAchievement | `prisma/schema.prisma` | User achievements |

### Enums

| Enum | Values |
|------|--------|
| Rank | Bronze, Silver, Gold, Platinum, Diamond, Elite, Legendary |
| XPActionType | Various XP action types |
| Role | User, Creator, Admin |
| SquadType | Public, Private, Secret |

---

## 8. XP System

### Canonical Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/xp.js` | XP awarding logic | **CANONICAL** |
| `create_xplog_idempotency_patch.sql` | Idempotency patch | Applied |

### XP Configuration

| Feature | Status | Notes |
|---------|--------|-------|
| XP_ENABLED flag | Partial | Flag exists but inconsistent |
| Idempotency | Violated | Required by spec, violated in `api/squads.js` |

### Known Issues

| File | Issue |
|------|-------|
| `api/squads.js` | Missing idempotencyKey in XP award |
| Multiple API routes | Not using `lib/xp.js` for XP awards |

---

## 9. Key Components

### Auth Components

| Component | File | Purpose |
|-----------|------|---------|
| AuthProvider | `components/AuthProvider.js` | React context provider |
| EnsurePrismaUserOnMount | `components/EnsurePrismaUserOnMount.jsx` | User existence guard |
| useAuthedPrismaUser | `hooks/useAuthedPrismaUser.js` | User data hook |

### Chat Components

| Component | File | Purpose |
|-----------|------|---------|
| ChatWindow | `components/ChatWindow.jsx` | Main chat interface |
| SquadChat | `components/SquadChat.js` | Squad-specific chat |
| ChatControls | `components/ChatControls.js` | Chat input controls |

### Navigation/Layout

| Component | File | Purpose |
|-----------|------|---------|
| Navbar | `components/Navbar.js` | Site navigation |
| AppShell | `components/AppShell.js` | Main layout shell |

### Other Key Components

| Component | File | Purpose |
|-----------|------|---------|
| AchievementGrid | `components/AchievementGrid.js` | Achievement display |
| Leaderboard | `components/Leaderboard.js` | XP rankings |
| LiveChat | `components/LiveChat.js` | Live streaming chat |
| GatedPlayer | `components/GatedPlayer.js` | Auth-gated content |
| Homebase | `components/Homebase.jsx` | User homebase |

---

## 10. Conflicts/Drift Summary

### Critical Issues (Must Fix)

| Issue | Severity | Location |
|-------|----------|----------|
| Missing auth on resource creation APIs | CRITICAL | `pages/api/audio/create.js`, `pages/api/images.js`, `pages/api/videos.js`, `pages/api/bundles/create.js` |
| Secrets exposure risk | CRITICAL | `pages/api/debug-env.js`, `pages/api/debug-db.js` |
| Duplicate Supabase clients | HIGH | 50+ files using ad-hoc `createClient()` |
| Local requireAdmin in API | HIGH | `pages/api/admin/onboarding/steps.js` |

### Major Issues (Should Fix)

| Issue | Severity | Location |
|-------|----------|----------|
| XP idempotency violated | HIGH | `api/squads.js` |
| lib/supabaseClient.js duplicate | MEDIUM | `lib/supabaseClient.js` |
| Inconsistent auth wrappers | MEDIUM | `lib/auth.js` vs `lib/auth-middleware.js` |

### Minor Issues (Nice to Fix)

| Issue | Severity | Location |
|-------|----------|----------|
| Multiple Leaderboard components | LOW | `components/Leaderboard.js` vs `components/Leaderboard.jsx` |
| Duplicate test files | LOW | `pages/test.js`, `pages/api/test-hash.js` |
| Inconsistent naming | LOW | `pages/creator.jsx` vs `pages/creator-portal.js` |

### Pattern Violations

| Pattern | Violation Count |
|---------|-----------------|
| Ad-hoc Supabase client creation | ~50+ files |
| XP not using canonical `lib/xp.js` | ~10+ files |
| API routes without auth gate | ~15+ files |

---

## 11. Next Steps

### Immediate Actions (MVP Critical)

1. [ ] Add auth gating to `pages/api/images.js`, `pages/api/videos.js`, `pages/api/audio/create.js`
2. [ ] Remove or secure debug endpoints (`debug-db.js`, `debug-env.js`)
3. [ ] Replace all ad-hoc Supabase clients with canonical imports
4. [ ] Fix XP idempotency in `api/squads.js`

### Short-term (MVP Nice)

1. [ ] Remove duplicate `lib/supabaseClient.js`
2. [ ] Consolidate local `requireAdmin` to canonical
3. [ ] Add XP_ENABLED flag consistency
4. [ ] Standardize naming conventions

### Long-term (Post-MVP)

1. [ ] Full auth audit across all API routes
2. [ ] Component consolidation (Leaderboard, etc.)
3. [ ] API route refactoring for consistency
4. [ ] Comprehensive test coverage

---

*Generated from repository inventory. Last updated: 2024*
