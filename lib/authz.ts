import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  mustChangePassword: boolean;
};

/**
 * The Data Access Layer entry point. Every server component and server action
 * that touches user data starts here — the proxy is only an optimistic gate.
 *
 * One primary-key read per request, memoized by React. The read is deliberate:
 * a JWT cannot know that an account was deactivated or demoted, and waiting
 * for a 12-hour token to expire is not an acceptable window for either.
 */
export const getSessionUser = cache(
  async (): Promise<SessionUser | null> => {
    const session = await auth();

    if (!session?.user?.id) return null;

    const account = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    // Deactivated or deleted: treat the session as gone.
    if (!account?.isActive) return null;

    return {
      id: account.id,
      email: account.email,
      name: account.name,
      image: account.image,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
    };
  },
);

export async function requireUser(
  options: { allowPasswordChange?: boolean } = {},
): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) redirect("/login");

  if (user.mustChangePassword && !options.allowPasswordChange) {
    redirect("/set-password");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") redirect("/dashboard");

  return user;
}

/**
 * Reviews are open to global administrators and to project leads. A lead's
 * scope is the list of projects they lead; `null` means "everything".
 */
export async function requireReviewer(): Promise<{
  user: SessionUser;
  projectIds: string[] | null;
}> {
  const user = await requireUser();

  if (user.role === "ADMIN") return { user, projectIds: null };

  const memberships = await db.projectMember.findMany({
    where: { userId: user.id, role: "LEAD" },
    select: { projectId: true },
  });

  if (memberships.length === 0) redirect("/dashboard");

  return { user, projectIds: memberships.map((member) => member.projectId) };
}

/** Cheap check for showing the Reviews link without running the page. */
export async function canReview(user: SessionUser): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  const lead = await db.projectMember.findFirst({
    where: { userId: user.id, role: "LEAD" },
    select: { projectId: true },
  });

  return Boolean(lead);
}

/**
 * Admin sees every project; members see only the ones they were added to.
 * Missing and forbidden are deliberately indistinguishable.
 */
export async function requireProjectAccess(projectId: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });

  if (!project) notFound();

  const isMember = project.members.length > 0;
  if (user.role !== "ADMIN" && !isMember) notFound();

  return {
    user,
    project,
    projectRole: isMember ? project.members[0].role : null,
  };
}
