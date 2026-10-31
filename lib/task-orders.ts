import "server-only";

import type { SessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import type {
  ProjectRole,
  TaskOrderStatus,
} from "@/lib/generated/prisma/enums";

export type TaskOrderSummary = {
  id: string;
  title: string;
  brief: string | null;
  status: TaskOrderStatus;
  hidden: boolean;
  createdAt: Date;
  createdBy: { name: string };
  submissionCount: number;
};

/**
 * One rule for the whole feature: project leads and global administrators
 * create, close, hide and delete orders; everyone on the project can read them
 * and attach work while they are open.
 */
export function canManageTaskOrders(
  user: SessionUser,
  projectRole: ProjectRole | null,
): boolean {
  return user.role === "ADMIN" || projectRole === "LEAD";
}

/**
 * Hidden orders are invisible to ordinary members, so only managers get them in
 * their lists.
 */
export async function listTaskOrders(
  projectId: string,
  options: { includeHidden?: boolean } = {},
) {
  const rows = await db.taskOrder.findMany({
    where: {
      projectId,
      ...(options.includeHidden ? {} : { hidden: false }),
    },
    // Enum order is OPEN, CLOSED, so open orders bubble up.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      brief: true,
      status: true,
      hidden: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
  });

  return rows.map(
    (row): TaskOrderSummary => ({
      id: row.id,
      title: row.title,
      brief: row.brief,
      status: row.status,
      hidden: row.hidden,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      submissionCount: row._count.submissions,
    }),
  );
}

export async function getTaskOrder(projectId: string, taskOrderId: string) {
  const order = await db.taskOrder.findFirst({
    where: { id: taskOrderId, projectId },
    select: {
      id: true,
      title: true,
      brief: true,
      status: true,
      hidden: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
  });

  if (!order) return null;

  return { ...order, submissionCount: order._count.submissions };
}

/** Only open, visible orders can take new work — so only those are offered. */
export async function listOpenTaskOrders(projectId: string) {
  return db.taskOrder.findMany({
    where: { projectId, status: "OPEN", hidden: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
}
