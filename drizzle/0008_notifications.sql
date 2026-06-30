DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM('new_event', 'attendee_signed_up', 'attendee_dropped_out');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" varchar(255) NOT NULL,
  "type" "notification_type" NOT NULL,
  "message" text NOT NULL,
  "groupId" integer REFERENCES "groups"("id") ON DELETE CASCADE,
  "eventId" integer REFERENCES "events"("id") ON DELETE CASCADE,
  "readAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
