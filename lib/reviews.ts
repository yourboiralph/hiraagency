import "server-only";

import { fromDbDate, type WorkDate } from "@/lib/date";
import { db } from "@/lib/db";

export type ReviewItem = {
  id: string;
  title: string;
  notes: string | null;
  workDate: WorkDate;
  createdAt: Date;
  project: { id: string; name: string; slug: string; color: string; image: string | null };
  author: { id: string; name: string; email: string };
  taskOrder: { id: string; title: string } | null;
  links: {
    id: string;
    url: string;
    label: string | null;
    platform: string | null;
  }[];
  images: { id: string; key: string }[];
};

/** Oldest first: the queue is worked front to back, not newest first. */
export async function listPendingReviews(
  options: { projectIds?: string[] | null; take?: number } = {},
): Promise<ReviewItem[]> {
  const { projectIds = null, take = 50 } = options;

  const rows = await db.submission.findMany({
    where: {
      status: "PENDING",
      ...(projectIds ? { projectId: { in: projectIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take,
    select: {
      id: true,
      title: true,
      notes: true,
      workDate: true,
      createdAt: true,
      project: {
        select: { id: true, name: true, slug: true, color: true, image: true },
      },
      author: { select: { id: true, name: true, email: true } },
      taskOrder: { select: { id: true, title: true } },
      links: {
        orderBy: { position: "asc" },
        select: { id: true, url: true, label: true, platform: true },
      },
      images: {
        orderBy: { position: "asc" },
        select: { id: true, key: true },
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
