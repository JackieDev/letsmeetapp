CREATE TABLE "members" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"profilePicture" varchar(500),
	"city" varchar(100),
	"interests" text,
	"billingCustomerId" varchar(255),
	"billingSubscriptionId" varchar(255),
	"billingPlanId" varchar(255),
	"billingStatus" varchar(50),
	"billingPeriodEnd" timestamp,
	"isPaidSubscriber" boolean DEFAULT false NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"senderUserId" varchar(255) NOT NULL,
	"recipientUserId" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"readAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "isMemberApproved" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "requiresMemberApproval" boolean DEFAULT false NOT NULL;