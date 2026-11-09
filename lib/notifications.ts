import "server-only";

import { db } from "@/lib/db";

/**
 * One notification per active admin and per lead of the project, excluding the
 * author. Best-effort: a submission should not fail because notifications did.
 */
export async function notifyReviewersOfSubmission({
  submissionId,
  projectId,
  authorId,
}: {
  submissionId: string;
  projectId: string;
  authorId: string;
}): Promise<void> {
  const recipients = await db.user.findMany({
    where: {
      isActive: true,
      id: { not: authorId },
      OR: [
        { role: "ADMIN" },
        { memberships: { some: { projectId, role: "LEAD" } } },
      ],
    },
    select: { id: true },
  });

  if (recipients.length === 0) return;

  await db.notification.createMany({
    data: recipients.map((recipient) => ({
      recipientId: recipient.id,
      submissionId,
    })),
  });
}

export async function getUnreadNotificationCount(
  recipientId: string,
): Promise<number> {
  return db.notification.count({
    where: { recipientId, readAt: null },
  });
}

export async function listNotifications(recipientId: string, take = 50) {
  return db.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      readAt: true,
      createdAt: true,
      submission: {
        select: {
          id: true,
          title: true,
          status: true,
          author: { select: { name: true, image: true } },
          project: { select: { name: true, slug: true, color: true } },
        },
      },
    },
  });
}

export async function markAllNotificationsRead(
  recipientId: string,
): Promise<void> {
  await db.notification.updateMany({
    where: { recipientId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** A review decision settles the notification for every recipient. */
export async function markSubmissionNotificationsRead(
  submissionId: string,
): Promise<void> {
  await db.notification.updateMany({
    where: { submissionId, readAt: null },
    data: { readAt: new Date() },
  });
}
