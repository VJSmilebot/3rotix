# AI_RULES

These rules exist to stop Copilot/Cline/ChatGPT from freelancing changes that break 3rotix. Follow these rules before writing or suggesting code.

## 1. Mandatory reading order

Before proposing changes:
1. Read `ARCHITECTURE.md`
2. Read `XP_TRIGGERS.md` (once it exists)
3. Then read the target file(s)

If any conflict exists, the docs are the source of truth.

---

## 2. Hard bans

Do not introduce or reintroduce:
- NextAuth (no `next-auth`, no `getServerSession`, no `authOptions`, no `[...nextauth]`)
- Multiple Prisma clients or duplicate prisma helper files
- Direct DB reads/writes via Supabase client in application code
- Prisma migrations (`prisma migrate dev`, `migrate deploy`) as the schema source of truth
- Placeholder fields like `id: String` in any Prisma create/upsert calls

---

## 3. Allowed Supabase usage

Supabase is allowed for:
- Client auth session
- Storage uploads/downloads

Supabase is not allowed for:
- Querying or mutating core application tables (use Prisma)

Use only the canonical modules:
- `lib/supabaseClient.js` exporting `supabase`
- `lib/supabaseAdmin.js` exporting `supabaseAdmin`

---

## 4. Prisma rules

- DB access is Prisma only.
- Do not add new models lightly.
- Do not change schema casually.
- If schema changes are needed:
  - propose the Supabase SQL change first
  - then update `prisma/schema.prisma`
  - then run `npx prisma generate`

IDs:
- If a model uses `@default(uuid())`, never pass `id` in create/upsert.
- If a model does not generate `id`, generate a real UUID and pass it explicitly.
- Never use placeholder `id` values.

---

## 5. XP and achievements rules

- Do not award XP directly in pages/components.
- Do not modify `User.totalXp` directly in random routes.
- All XP must be awarded via centralized utilities (xp/achievement/tracker layer).
- Every XP event must create an `XPLog` row.
- Every XP award must use an idempotency strategy to avoid duplicates.

If adding a new XP trigger:
- Update `XP_TRIGGERS.md` first
- Then implement in the correct central location
- Then add a test path (script or endpoint) to verify it

---

## 6. Transactions and counters

If a change affects both:
- a membership row and a squad memberCount
- a message row and derived stats
- XP logs and user totals

Then it must use `prisma.$transaction` or an equivalent safe pattern.

Never update a counter without updating the underlying row change in the same operation.

---

## 7. Editing discipline

When editing code:
- Make minimal, targeted changes.
- Do not refactor unrelated files.
- Do not introduce new libraries unless requested.
- Keep consistent style (CommonJS vs ESM) with the file’s existing pattern.
- Prefer adding small, testable functions over large rewrites.

If you are unsure:
- Ask for the relevant file(s) instead of guessing.

---

## 8. Output expectations for suggested changes

Any suggestion must include:
- What file(s) change
- Why the change is needed
- How it aligns with `ARCHITECTURE.md`
- How to test it quickly (one command or one manual flow)

If it cannot be tested easily, it is not ready to merge.
