ALTER TABLE "groups" ADD COLUMN "requiresMemberApproval" boolean DEFAULT false NOT NULL;
ALTER TABLE "group_members" ADD COLUMN "isMemberApproved" boolean DEFAULT true NOT NULL;

