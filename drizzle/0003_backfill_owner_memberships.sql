-- Ensure every group owner has a membership row in `group_members`.
-- This is safe to run multiple times (inserts only when missing).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'group_members'
      AND column_name = 'isMemberApproved'
  ) THEN
    ALTER TABLE "group_members" ADD COLUMN "isMemberApproved" boolean DEFAULT true NOT NULL;
  END IF;
END $$;

INSERT INTO "group_members" (
  "groupId",
  "userId",
  "name",
  "isBanned",
  "role",
  "joinedAt",
  "isMemberApproved"
)
SELECT
  g."id" AS "groupId",
  g."ownerId" AS "userId",
  COALESCE(m."name", 'Group owner') AS "name",
  false AS "isBanned",
  'owner' AS "role",
  now() AS "joinedAt",
  true AS "isMemberApproved"
FROM "groups" AS g
LEFT JOIN "members" AS m
  ON m."userId" = g."ownerId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "group_members" AS gm
  WHERE gm."groupId" = g."id"
    AND gm."userId" = g."ownerId"
);

