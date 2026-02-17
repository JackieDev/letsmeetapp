import { integer, pgTable, varchar, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Enum for group member roles
export const memberRoleEnum = pgEnum("member_role", ["owner", "organizer", "member"]);

// Groups table
export const groupsTable = pgTable("groups", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  profilePicture: varchar({ length: 500 }), // URL/path to group profile picture
  city: varchar({ length: 100 }).notNull(), // UK city/town
  ownerId: varchar({ length: 255 }).notNull(), // Clerk user ID
  isApproved: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Events table
export const eventsTable = pgTable("events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer().notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  eventDate: timestamp().notNull(),
  location: varchar({ length: 500 }),
  organizerId: varchar({ length: 255 }).notNull(), // Clerk user ID
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Group members table (junction table for users and groups)
export const groupMembersTable = pgTable("group_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer().notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  role: memberRoleEnum().default("member").notNull(),
  joinedAt: timestamp().defaultNow().notNull(),
});

// Event attendees table (junction table for users and events)
export const eventAttendeesTable = pgTable("event_attendees", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer().notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  comments: text(), // Optional comments from attendee
  signedUpAt: timestamp().defaultNow().notNull(),
});
