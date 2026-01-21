# XP System: Ready, But OFF

## Current status
- XP is NOT active in MVP, but codebase must remain XP-ready.

## Hard law
- All XP writes go through `lib/xp.js` ONLY.
- Never write XP or XPLog directly anywhere else.

## Idempotency (required)
- Every XP award must include a stable `idempotencyKey`.
- XPLog.idempotencyKey is non-null and uniqueness protected per spec in AI_RULES.md / XP_TRIGGERS.md.

## Feature-flag behavior
- Implement/maintain an `XP_ENABLED` flag pattern:
  - When disabled: XP awarding becomes a safe no-op (returns ok, does not break flows).
  - When enabled later: minimal changes required to turn on.

## Don’t block MVP
- If XP isn’t needed for a flow to work, leave hooks/TODOs and move on.
