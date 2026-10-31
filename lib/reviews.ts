import "server-only";

import { fromDbDate, type WorkDate } from "@/lib/date";
import { db } from "@/lib/db";

export type ReviewItem = {
  id: string;
  title: string;
  notes: string | null;
  workDate: WorkDate;
  createdAt: Date;
  project: { id: string; name: string; slug: string; color: string };
  author: { id: string; name: string; email: string };
  taskOrder: { id: string; title: string } | null;
  links: {
    id: string;
    url: string;
    label: string | null;
    platform: string | null;
  }[];
};

/** Oldest first: the queue is worked front to back, not newest first. */
export async function listPendingReviews(take = 50): Promise<ReviewItem[]> {
  const rows = await db.submission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take,
    select: {
      id: true,
      title: true,
      notes: true,
      workDate: true,
      createdAt: true,
      project: { select: { id: true, name: true, slug: true, color: true } },
      author: { select: { id: true, name: true, email: true } },
      taskOrder: { select: { id: true, title: true } },
      links: {
        orderBy: { position: "asc" },
        select: { id: true, url: true, label: true, platform: true },
      },
    },
  });

  return rows.map((row) => ({ ...row, workDate: fromDbDate(row.workDate) }));
}

export async function getPendingReviewSummary() {
  const [count, oldest] = await Promise.all([
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  return { count, oldestAt: oldest?.createdAt ?? null };
}
