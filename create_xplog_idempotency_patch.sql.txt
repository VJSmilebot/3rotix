-- Adds optional idempotencyKey column (if missing)
ALTER TABLE "public"."XPLog"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" text;

-- Create a partial unique index that only applies when idempotencyKey is NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_indexes
    WHERE  schemaname = 'public'
    AND    indexname  = 'XPLog_userId_idempotencyKey_key'
  ) THEN
    CREATE UNIQUE INDEX "XPLog_userId_idempotencyKey_key"
      ON "public"."XPLog" ("userId","idempotencyKey")
      WHERE "idempotencyKey" IS NOT NULL;
  END IF;
END $$;
