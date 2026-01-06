# XP_TRIGGERS (3ROTIX v1)

Source of truth for XP, achievements, and gamified interactions.

This document defines:
- actionTypes
- XP values
- eligibility rules
- required database writes
- canonical code owners
- what is implemented vs planned

If code conflicts with this file, this file wins.

---

## 0. Canonical Rules

### 0.1 Canonical awarding entrypoints

All XP must be awarded through the centralized XP utilities (not ad-hoc logic).

Canonical flow:
- Chat/squad message activity:
  - lib/chat-tracker.js -> trackChatActivity(...)
- Achievements:
  - lib/achievements.js
- Atomic XP award + logging:
  - lib/xp.js -> awardXp(...)

API routes may call these utilities but must not contain business logic.

### 0.2 Reward payload contract (required)

Any action that awards XP must return a consistent payload:

{
  xp: {
    base: number,
    achievements: number,
    total: number
  },
  achievements: Array<{
    name: string,
    slug: string,
    description: string | null,
    progress: number,
    target: number,
    completed: boolean,
    xpAwarded: number,
    isNew: boolean
  }>,
  rankUp?: {
    previousRank: string,
    newRank: string
  },
  badges?: Array<{
    slug: string,
    name: string,
    description?: string
  }>
}

Frontend toasts must use this payload and must not recompute totals.

### 0.3 Idempotency (required)

Every XP award must be idempotent. The idempotency strategy must prevent duplicates on:
- refresh
- retry
- double socket emit
- double submit

All XPLog rows must include a stable idempotencyKey.

NOTE: idempotencyKey is NON-NULLABLE and required for every award.

---

## 1. System / Admin Triggers

### ADMIN_GRANT (Implemented)

When:
- Manual XP grant for testing, bonuses, events, or moderator actions.

XP:
- Any (xpValue provided by caller)

actionType:
- ADMIN_GRANT

Database:
- XPLog (insert)
- User.totalXp (update)

Code owner:
- pages/api/xp/award.js
- lib/xp.js

Notes:
- For testing and manual boosts only.

---

## 2. Chat Triggers

Chat XP is orchestrated by:
- lib/chat-tracker.js
- lib/achievements.js
- lib/xp.js

### CHAT_MESSAGE (Implemented)

When:
- User sends a chat message (global or squad chat).
- This actionType covers both contexts.

Base XP:
- 5 XP per eligible message.

actionType:
- CHAT_MESSAGE

Database:
- Message table (ChatMessage or SquadChatMessage, depending on the feature)
- XPLog
- User.totalXp

refId:
- Must include context:
  - "chat-activity" (generic) OR
  - "squad:<squadId>" OR
  - "chat:<chatId>"
Pick one format and use it consistently.

#### Eligibility Rules (Anti-spam / Uniqueness) (Implemented)

A message earns base chat XP only if all are true:

1. Minimum length
- Normalized content length >= 5 characters
- Normalization:
  - lowercased
  - trimmed
  - collapse consecutive whitespace to single spaces

2. Uniqueness window
- Normalized content must not match any of the user’s last 20 normalized messages.
- This check applies across chat contexts (global + squad) unless explicitly overridden later.

3. Cooldown window
- User must not have received CHAT_MESSAGE XP within the last 10 seconds.
- Checked via the latest XPLog entry for that user with actionType = CHAT_MESSAGE.

If any rule fails:
- The message still sends
- No base XP is awarded
- Achievement progress may still update based on message count if defined

---

## 3. Achievement Triggers (via Achievement + UserAchievement)

Achievements are data-driven and stored in the database as rows in Achievement.
User progress is stored in UserAchievement.

### first-chat (Implemented)

Condition:
- User sends their first chat message.

XP:
- 100 XP once

Achievement row:
- Achievement.slug = "first-chat"
- targetValue = 1
- xpReward = 100

Code owner:
- lib/achievements.js
- lib/chat-tracker.js

### chat-master (Implemented)

Condition:
- User sends 1,000 chat messages.

XP:
- xpReward from Achievement row

Achievement row:
- Achievement.slug = "chat-master"
- targetValue = 1000

Code owner:
- lib/achievements.js
- lib/chat-tracker.js

Notes:
- Achievement XP is awarded only on completion.
- Progress increments can occur even if base chat XP is blocked by anti-spam rules.

---

## 4. Squad Triggers

Squad-related DB entities:
- Squad
- SquadMember
- SquadChatMessage
- SquadBan
- SquadMute

### JOIN_SQUAD (Implemented)

When:
- User joins a squad successfully (new membership created).

XP:
- 50 XP

actionType:
- JOIN_SQUAD

Database:
- SquadMember (insert)
- XPLog (insert)
- User.totalXp (update)

Code owner:
- pages/api/squads/[squadId]/join.js (or a service wrapper)
- lib/xp.js

Notes:
- Must be idempotent based on (squadId, userId)
- If membership already exists, do not award XP again.

### SQUAD_MEMBERCOUNT (Not an XP trigger)

When:
- User joins/leaves a squad.

Behavior:
- Update Squad.memberCount in the same transaction as SquadMember create/delete.

Notes:
- This is a data consistency rule, not XP.

---

## 5. Profile and Onboarding Triggers (Planned)

### PROFILE_CREATED (Implemented)

When:
- User profile row in Prisma is created.

XP:
- 25 XP

actionType:
- PROFILE_CREATED

Notes:
- Must be idempotent and awarded once.

### PROFILE_COMPLETED

When:
- User completes required profile fields (defined by product):
  - bio
  - avatar
  - at least one social link

XP:
- 50 XP

actionType:
- PROFILE_COMPLETED

Notes:
- Must be computed server-side (or on update endpoint) to prevent easy client spoofing.

---

## 6. Content and Streaming Triggers (Planned)

These are future triggers. They should not be implemented until the content/streaming features are stable.

Examples:
- STREAM_WATCHED
- STREAM_STREAK
- FOLLOW_CREATOR
- LIKE_VIDEO
- FIRST_UPLOAD
- FIRST_TIP_RECEIVED
- CONTENT_10_VIEWS
- CONTENT_SHARED

Rule:
- Any of these triggers must be explicitly added to:
  - this document
  - the Prisma enum (if you use one)
  - the centralized awarding utilities

---

## 7. Badges (Implemented as Achievements)

Badges are represented as standard Achievement rows.

Rules:
- Badge slugs must be unique.
- Unlocking creates/updates UserAchievement.
- Optional XP is granted via Achievement.xpReward or manual ADMIN_GRANT.

No new tables are required for v1 badges.

---

## 8. Agent / Tool Safety Rules

For any AI tool or agent working in this repo:

1. Never award XP by directly updating User.totalXp.
2. Never write to XPLog except through lib/xp.js.
3. Never create placeholder IDs (e.g. "id: String") in Prisma calls.
4. Never introduce NextAuth.
5. Do not add Prisma migrations. Schema changes are made via Supabase SQL, then Prisma schema is updated to match.
6. If adding a new trigger, update this file first, then implement centrally, then add a test.


