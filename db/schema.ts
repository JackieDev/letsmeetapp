import { integer, pgTable, varchar, text, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";

// Enum for group member roles
export const memberRoleEnum = pgEnum("member_role", ["owner", "organizer", "member"]);

// Groups table — name + city must be unique
export const groupsTable = pgTable(
  "groups",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    profilePicture: text(), // Supports URL/path or uploaded image data URL
    city: varchar({ length: 100 }).notNull(), // UK city/town
    ownerId: varchar({ length: 255 }).notNull(), // Clerk user ID
    isApproved: boolean().default(false).notNull(),
    notifiedApproval: boolean().default(false).notNull(),
    // If true, new join requests are created as "pending" until the group owner approves them.
    requiresMemberApproval: boolean().default(false).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (t) => [unique("groups_name_city_unique").on(t.name, t.city)]
);

// Members table — stores core profile info for users (keyed by Clerk user ID)
export const membersTable = pgTable(
  "members",
  {
    userId: varchar({ length: 255 }).primaryKey(), // Clerk user ID
    email: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }), // Display name for the user (global)
    // Supports remote URLs and uploaded image data URLs.
    profilePicture: text(),
    city: varchar({ length: 100 }),
    interests: text(), // free-form interests/bio field

    // Clerk Billing (B2C) fields
    billingCustomerId: varchar({ length: 255 }), // Clerk billing customer id (if available)
    billingSubscriptionId: varchar({ length: 255 }), // Clerk subscription id (top-level)
    billingPlanId: varchar({ length: 255 }), // The paid plan id we recognize
    billingStatus: varchar({ length: 50 }), // e.g. active, past_due, canceled
    billingPeriodEnd: timestamp(), // When the current paid period ends (if known)
    isPaidSubscriber: boolean().default(false).notNull(),
  },
  (t) => [unique("members_email_unique").on(t.email)]
);

// Events table
export const eventsTable = pgTable("events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer().notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  eventDate: timestamp().notNull(),
  location: varchar({ length: 500 }),
  organizerId: varchar({ length: 255 }).notNull(), // Clerk user ID
  attendeeLimit: integer(), // optional max attendees; null = no limit
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Group members table (junction table for users and groups)
export const groupMembersTable = pgTable("group_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer().notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  // Display name for the member inside this group (captured from Clerk on join).
  name: varchar({ length: 255 }).notNull(),
  isBanned: boolean().default(false).notNull(), // Whether this user is banned from the group
  // When the group requires approval, new members start as not approved.
  isMemberApproved: boolean().default(true).notNull(),
  role: memberRoleEnum().default("member").notNull(),
  joinedAt: timestamp().defaultNow().notNull(),
});

// Photos uploaded by group members within a specific group.
export const groupMemberPhotosTable = pgTable("group_member_photos", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer().notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  imageData: text().notNull(), // data URL for uploaded image
  createdAt: timestamp().defaultNow().notNull(),
});

// Event attendees table (junction table for users and events)
export const eventAttendeesTable = pgTable("event_attendees", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer().notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  comments: text(), // Optional comments from attendee
  signedUpAt: timestamp().defaultNow().notNull(),
});

// Event notes table — only attendees can add notes to an event
export const eventNotesTable = pgTable("event_notes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer().notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID (must be attendee)
  content: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Direct messages between users
export const messagesTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  senderUserId: varchar({ length: 255 }).notNull(), // Clerk user ID
  recipientUserId: varchar({ length: 255 }).notNull(), // Clerk user ID
  body: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  readAt: timestamp(),
});
