ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "accountPausedAt" timestamp;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "accountCanceledAt" timestamp;
