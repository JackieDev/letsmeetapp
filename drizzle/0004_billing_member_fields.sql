ALTER TABLE "members" ADD COLUMN "billingCustomerId" varchar(255);
ALTER TABLE "members" ADD COLUMN "billingSubscriptionId" varchar(255);
ALTER TABLE "members" ADD COLUMN "billingPlanId" varchar(255);
ALTER TABLE "members" ADD COLUMN "billingStatus" varchar(50);
ALTER TABLE "members" ADD COLUMN "billingPeriodEnd" timestamp;
ALTER TABLE "members" ADD COLUMN "isPaidSubscriber" boolean DEFAULT false NOT NULL;

