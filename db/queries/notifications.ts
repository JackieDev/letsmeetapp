import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notificationsTable } from "@/db/schema";

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationInsert = typeof notificationsTable.$inferInsert;

export async function insertNotification(data: NotificationInsert) {
  const [row] = await db.insert(notificationsTable).values(data).returning();
  return row!;
}

export async function insertNotifications(data: NotificationInsert[]) {
  if (data.length === 0) return;
  await db.insert(notificationsTable).values(data);
}

export async function getNotificationsForUser(userId: string, limit = 50): Promise<Notification[]> {
  return db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        isNull(notificationsTable.readAt)
      )
    );
  return row?.count ?? 0;
}

export async function markNotificationRead(id: number, userId: string) {
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, userId),
        isNull(notificationsTable.readAt)
      )
    );
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.userId, userId),
        isNull(notificationsTable.readAt)
      )
    );
}
