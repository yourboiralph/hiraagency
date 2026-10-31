import "server-only";

import { db } from "@/lib/db";

export async function listUsers() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      _count: { select: { memberships: true } },
    },
  });

  return users.map((user) => ({
    ...user,
    projectCount: user._count.memberships,
  }));
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>[number];
