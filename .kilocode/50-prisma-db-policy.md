# Prisma + DB Policy (No Migrations)

## No Prisma migrations (ever)
Forbidden:
- prisma migrate dev
- prisma migrate deploy
- any CI/production migration commands

## How schema changes happen
1) Write/apply SQL in Supabase
2) Run: `prisma db pull`
3) Run: `prisma generate`

## Scope
- Prisma models map to PUBLIC schema only.
- Do not model/write to Supabase auth schema tables.

## Multi-write safety
- Use `prisma.$transaction()` when multiple writes must succeed/fail together.

## Connection rules
- Follow ARCHITECTURE.md for DATABASE_URL vs DIRECT_URL usage.
- Do not connect Prisma through transaction pooler mode if ARCHITECTURE.md forbids it.
