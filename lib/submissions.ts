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
  /** Totals stay visible even when the viewer may not see the items. */
  counts: { links: number; images: number };
  /** True when notes, links or images exist but this viewer may not see them. */
  hasHiddenDetails: boolean;
};

export async function listProjectSubmissions(
  projectId: string,
  options: {
    take?: number;
    taskOrderId?: string;
    /** Only work dated for this calendar day. */
    workDate?: WorkDate;
    statuses?: SubmissionStatus[];
    /** Leads and admins see every submission's notes, links and images. */
    canViewAllDetails?: boolean;
    /** Authors always see their own details. */
    viewerId?: string;
  } = {},
): Promise<FeedSubmission[]> {
  const canViewAll = options.canViewAllDetails ?? false;
  const viewerId = options.viewerId ?? "";
  const ownDetails = { submission: { authorId: viewerId } };

  const rows = await db.submission.findMany({
    where: {
      projectId,
      ...(options.taskOrderId ? { taskOrderId: options.taskOrderId } : {}),
      ...(options.workDate ? { workDate: toDbDate(options.workDate) } : {}),
      ...(options.statuses ? { status: { in: options.statuses } } : {}),
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
        ...(canViewAll ? {} : { where: ownDetails }),
        orderBy: { position: "asc" },
        select: { id: true, url: true, platform: true, label: true },
      },
      images: {
        ...(canViewAll ? {} : { where: ownDetails }),
        orderBy: { position: "asc" },
        select: { id: true, key: true },
      },
      _count: { select: { links: true, images: true } },
    },
  });

  return rows.map(({ _count, ...row }) => {
    const canSeeDetails = canViewAll || row.author.id === viewerId;
    const counts = { links: _count.links, images: _count.images };

    return {
      ...row,
      workDate: fromDbDate(row.workDate),
      notes: canSeeDetails ? row.notes : null,
      reviewNote: canSeeDetails ? row.reviewNote : null,
      links: canSeeDetails ? row.links : [],
      images: canSeeDetails ? row.images : [],
      counts,
      hasHiddenDetails:
        !canSeeDetails &&
        (Boolean(row.notes) ||
          Boolean(row.reviewNote) ||
          counts.links > 0 ||
          counts.images > 0),
    };
  });
}

/** Submissions per workday for a range, used to mark the project calendar. */
export async function countProjectSubmissionsByWorkDate(
  projectId: string,
  range: { from: WorkDate; to: WorkDate },
): Promise<Map<WorkDate, number>> {
  const rows = await db.submission.groupBy({
    by: ["workDate"],
    where: {
      projectId,
      workDate: {
        gte: toDbDate(range.from),
        lte: toDbDate(range.to),
      },
    },
    _count: { _all: true },
  });

  return new Map(
    rows.map((row) => [fromDbDate(row.workDate), row._count._all]),
  );
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
