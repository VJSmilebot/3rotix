# 3ROTIX Platform – Architecture Overview

This doc is the source of truth for how the 3rotix platform is structured. Any future AI / tools must follow this.

---

## 1. Tech Stack

- **Framework:** Next.js (Pages Router, not App Router)
- **Runtime:** Node.js
- **Frontend:** React + TailwindCSS
- **Backend:** Next.js API routes
- **Database:** Postgres (Supabase)
- **ORM:** Prisma
- **Auth:** Supabase Auth (NOT NextAuth)
- **Real-time Chat:** Socket.IO + Prisma
- **File Storage / Avatars / Media:** Supabase Storage
- **Video / Streaming:** Livepeer (WIP, not core to MVP)

---

## 2. Auth & Identity

Authoritative identity is:

- **Supabase Auth** for login / sessions.
- **Prisma `User` model** for roles, XP, handles, public profile.

Key rules:

- We DO NOT use NextAuth in this project.
  - No `getServerSession`, no `authOptions`, no `next-auth` imports.
- Client obtains the current user via Supabase:
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange()`
- API routes expect an explicit `userId` (from client) or Supabase JWT validation, not NextAuth session.

User roles:

- Enum `Role` in Prisma: `CREATOR`, `FAN`, `MOD`, etc.
- Stored on `User.role`.

---

## 3. Database & Prisma

The database is managed exclusively via Prisma.

Key models (high level):

- `User`
  - Identity, role, profile, XP totals, rank, level.
- `Squad`
  - Creator-led groups / communities.
- `SquadMember`
  - Membership of a user in a squad.
- `SquadChat`
  - Chat configuration per squad (isOpen, permissions, slow mode).
- `SquadChatMessage`
  - Messages in squad chats.
- `XPLog`
  - Atomic XP events (who, how much, action type, refId, idempotencyKey).
- `Achievement`
  - Static definitions of achievements (name, slug, xpReward, category, targetValue).
- `UserAchievement`
  - User progress/completion for achievements.
- `SquadAchievement`
  - Squad-level achievements (optional, WIP).
- Additional models (Stream, Video, Content, etc.) exist but are not required for core chat/gamification MVP.

ID strategy:

- Most models use:
  - `id String @id @default(uuid())`
- **Never set `id` manually in Prisma `create` / `upsert` unless there is a specific reason.**
  - NO `id: String`
  - NO hard-coded ID strings in `data:` unless we know exactly what we’re doing.

Location:

- Prisma schema: `prisma/schema.prisma`
- Prisma client helper: `lib/prisma.js`

---

## 4. Gamification System

Core files:

- `lib/xp.js`
  - Low-level XP operations:
    - `awardXP`
    - XP validation
    - Writes to `XPLog`
    - Updates `User.totalXp`, `User.rank`, `User.level`
- `utils/achievements.js`
  - Achievement config + rules:
    - `upsertAchievementProgress`
    - Progress tracking
    - Completion logic
    - Returns new achievements earned for a given action
- `utils/chat-tracker.js`
  - Orchestration layer for chat-based XP:
    - `trackChatActivity({ userId, messageCount, messageText })`
    - Applies chat-specific rules (no XP for spam, uniqueness checks, min length, rate limits).
    - Calls into `xp.js` + `achievements.js`.
    - Returns canonical rewards object:
      ```ts
      {
        xp: { chat: number, achievements: number, total: number },
        achievements: AchievementAward[]
      }
      ```
- `utils/xp-manager.js`
  - Legacy shim that forwards to `lib/xp.js` for backward compatibility.

XP principles:

- XP is **only** granted via centralized utility functions (e.g. `trackChatActivity`, `awardXp`).
- Every XP event is logged in `XPLog` with:
  - `userId`
  - `xpValue`
  - `actionType` (enum, e.g. `CHAT_MESSAGE`, `ADMIN_GRANT`, etc.)
  - `refId`
  - `idempotencyKey` (prevent duplicates).
- Ranks and levels are derived from total XP and updated transactionally.

---

## 5. Squads & Membership

Key models:

- `Squad`
  - Owner (`ownerId`), creator (`creatorId`).
  - `memberCount` is stored and maintained via transactions.
- `SquadMember`
  - Composite unique key `squadId_userId`.
  - `role` (MEMBER, MOD, etc.).
  - `contributionXp`.

Join flow:

- API route: `pages/api/squads/[squadId]/join.js`
- Behavior:
  1. Validate method = POST.
  2. Read `{ squadId }` from query and `{ userId }` from body.
  3. Confirm squad exists.
  4. Check for existing membership via `squadId_userId`.
  5. If already a member → return `{ alreadyMember: true }`.
  6. Otherwise, create membership + increment `squad.memberCount` in a `$transaction`.

Key rule:

- All changes to `memberCount` **must** happen in transactions that also touch `SquadMember`, so counts stay accurate.

---

## 6. Chat System

Core pieces:

- `services/squad-chat.js`
  - Server-side service for squad chat behavior:
    - `sendMessage(chatId, userId, content)`
    - `getMessages(chatId, limit, before)`
    - `muteUser`, `banUser`, `updateChatSettings`, etc.
  - `sendMessage` responsibilities:
    - Validate chat is open and user not banned/muted.
    - Check content permissions (links, emojis, etc.).
    - Create `SquadChatMessage` record.
    - Call `trackChatActivity({ userId, messageCount: 1, messageText: content })`.
    - Emit `new-message` event via Socket.IO:
      ```js
      io.to(`squad:${chat.squadId}`).emit("new-message", { message, rewards });
      ```
- `services/squad-stats.js`
  - Aggregates squad info, level, top contributors, recent achievements.

- `components/Homebase.jsx`
  - Main squad home / chat UI.
  - Connects to Socket.IO with Supabase JWT.
  - Handles:
    - Displaying messages
    - Sending messages via `squadChatService`
    - Reacting to `new-message` events
    - Showing XP toasts on reward events.

- `components/XpToast.tsx` and related toast components
  - UX layer for showing XP gains, rank ups, badges.

Message → XP flow:

1. User enters message in Homebase.
2. Frontend calls `squadChatService.sendMessage(chatId, userId, content)`.
3. Backend `sendMessage`:
   - Validates
   - Saves the message
   - Calls `trackChatActivity`
   - Emits `{ message, rewards }` via Socket.IO.
4. Frontend:
   - Adds message to local state.
   - Uses `rewards.xp.total` (and achievements) to show XP / badge / rank toasts.

Spam / uniqueness rules:

- Implemented in `trackChatActivity` / `achievements` layer.
- Do NOT sprinkle ad-hoc XP logic in random API routes or components.

---

## 7. API Design Patterns

- All API routes live in `pages/api/**`.
- Each route:
  - Validates HTTP method.
  - Validates required inputs.
  - Uses Prisma via `lib/prisma.js`.
  - Logs errors with enough context to debug later.
  - Returns JSON with `{ ok, ... }` or `{ error, details }`.

Common patterns:

- **XP APIs**
  - Example: `pages/api/xp/award.js`
  - Use `xp.awardXp` + `XPLog` + idempotency.

- **Squad APIs**
  - `pages/api/squads/index.js` → list squads.
  - `pages/api/squads/[squadId]/join.js` → join squad.
  - `pages/api/squads/[squadId]/settings.js` → update chat/squad settings.

---

## 8. Frontend Patterns

- UI is built in React components under `components/`.
- Pages under `pages/` should be mostly wiring and layout, not heavy logic.
- State is usually local `useState` + `useEffect`; no global state library in this MVP.
- Network calls:
  - Prefer using dedicated service modules in `services/` (e.g. `squad-chat.js`, `squad-stats.js`) rather than calling `fetch` directly everywhere.
- All external links should open in new tabs (`target="_blank"`, `rel="noopener noreferrer"`).

---

## 9. AI / Tooling Rules

These rules are for Copilot, Cline, JauMemory, ChatGPT, or any other assistants working on this codebase:

1. **Do NOT introduce NextAuth.**
   - No `next-auth` package.
   - No `getServerSession`.
   - No `authOptions` or `[...nextauth]` routes.
   - Auth is Supabase-only.

2. **Do NOT set `id` fields manually for Prisma models that use `@default(uuid())`.**
   - Never add `id: String` to `data` in `create` or `upsert`.
   - Let Prisma generate UUIDs.

3. **Do NOT write ad-hoc XP updates.**
   - Always use `utils/xp.js`, `utils/achievements.js`, and `utils/chat-tracker.js` for XP/achievement logic.
   - Every XP grant should create an `XPLog` row.

4. **Do NOT bypass services when adding new features.**
   - For squads & chat, go through:
     - `services/squad-chat.js`
     - `services/squad-stats.js`
   - Do not embed heavy DB logic directly in React components.

5. **Respect transactions for critical counters.**
   - For anything that updates both a row and a summary count (e.g. `SquadMember` + `Squad.memberCount`), use `prisma.$transaction`.

6. **Keep auth + identity consistent.**
   - Auth = Supabase JWT.
   - Identity = Prisma `User` tied to Supabase user.
   - Socket auth should use Supabase access token, not cookies from another system.

7. **Before changing schema:**
   - Update `prisma/schema.prisma`.
   - Run `npx prisma migrate dev` or `prisma db push` (depending on strategy).
   - Then run `npx prisma generate`.

---

## 10. MVP Focus

For MVP / v1, these are the core loops that must remain stable:

1. User can sign up / log in via Supabase.
2. User can join squads and see accurate member counts.
3. User can send chat messages in squads.
4. XP is awarded correctly for chat and logged in `XPLog`.
5. Achievements and ranks update correctly and show via UI toasts.
6. No reliance on NextAuth anywhere in the codebase.

Everything else (streams, videos, badges V2, fancy UI, etc.) is secondary to keeping these loops solid.
