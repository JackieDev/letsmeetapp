CREATE TABLE IF NOT EXISTS "obligatory_questions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "groupId" integer NOT NULL,
  "question" text NOT NULL,
  "sortOrder" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "obligatory_questions" ADD CONSTRAINT "obligatory_questions_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
