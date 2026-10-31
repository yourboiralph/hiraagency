import "server-only";

import {
  fromDbDate,
  toDbDate,
  workDateToday,
  type WorkDate,
} from "@/lib/date";
import { db } from "@/lib/db";
import type { SubmissionStatus } from "@/lib/generated/prisma/enums";

export type FeedLink = {
  id: string;
  url: string;
  platform: string | null;
  label: string | null;
};

export type FeedSubmission = {
  id: string;
  title: string;
  notes: string | null;
  status: SubmissionStatus;
  reviewNote: string | null;
  workDate: WorkDate;
  createdAt: Date;
  reviewedAt: Date | null;
  author: { id: string; name: string; image: string | null };
  reviewer: { name: string } | null;
  taskOrder: { id: string; title: string; hidden: boolean } | null;
  links: FeedLink[];
  images: { id: string; key: string }[];
};

export async function listProjectSubmissions(
  projectId: string,
  options: { take?: number; taskOrderId?: string } = {},
): Promise<FeedSubmission[]> {
  const rows = await db.submission.findMany({
    where: {
      projectId,
      ...(options.taskOrderId ? { taskOrderId: options.taskOrderId } : {}),
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: options.take ?? 60,
    select: {
      id: true,
      title: true,
      notes: true,
      status: true,
      reviewNote: true,
      workDate: true,
      createdAt: true,
      reviewedAt: true,
      author: { select: { id: true, name: true, image: true } },
      reviewer: { select: { name: true } },
      taskOrder: { select: { id: true, title: true, hidden: true } },
      links: {
        orderBy: { position: "asc" },
        select: { id: true, url: true, platform: true, label: true },
      },
      images: {
        orderBy: { position: "asc" },
        select: { id: true, key: true },
      },
    },
  });

  return rows.map((row) => ({
    ...row,
    workDate: fromDbDate(row.workDate),
  }));
}

/** Dashboard: what this person submitted for one workday, newest first. */
export async function listMySubmissionsForDate(
  authorId: string,
  workDate: WorkDate = workDateToday(),
) {
  return db.submission.findMany({
    where: { authorId, workDate: toDbDate(workDate) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      project: { select: { name: true, slug: true, color: true, image: true } },
      _count: { select: { links: true } },
    },
  });
}
