-- Idempotent: safe when members already exists (db:push) or was never created (migrate gap).
CREATE TABLE IF NOT EXISTS "members" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"profilePicture" text,
	"city" varchar(100),
	"interests" text,
	"billingCustomerId" varchar(255),
	"billingSubscriptionId" varchar(255),
	"billingPlanId" varchar(255),
	"billingStatus" varchar(50),
	"billingPeriodEnd" timestamp,
	"isPaidSubscriber" boolean DEFAULT false NOT NULL,
	"signedUpAt" timestamp,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);

