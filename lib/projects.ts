import "server-only";

import { notFound } from "next/navigation";

import type { SessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import type {
  ProjectRole,
  ProjectStatus,
} from "@/lib/generated/prisma/enums";
import { slugify } from "@/lib/slug";

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  color: string;
  status: ProjectStatus;
  memberCount: number;
  submissionCount: number;
  myRole: ProjectRole | null;
  /** Most recent work date this user submitted for, if any. */
  myLastWorkDate: Date | null;
};

export type ProjectMemberView = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: ProjectRole;
  addedAt: Date;
};

/**
 * Admins see every project; members see only the projects they belong to.
 * This mirrors `requireProjectAccess` on purpose — one rule, one shape.
 */
export async function listProjects(
  user: SessionUser,
): Promise<ProjectSummary[]> {
  const projects = await db.project.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { members: { some: { userId: user.id } } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      color: true,
      status: true,
      _count: { select: { members: true, submissions: true } },
      members: { where: { userId: user.id }, select: { role: true } },
      submissions: {
        where: { authorId: user.id },
        orderBy: { workDate: "desc" },
        take: 1,
        select: { workDate: true },
      },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    image: project.image,
    color: project.color,
    status: project.status,
    memberCount: project._count.members,
    submissionCount: project._count.submissions,
    myRole: project.members[0]?.role ?? null,
    myLastWorkDate: project.submissions[0]?.workDate ?? null,
  }));
}

export async function getProjectForUser(slug: string, user: SessionUser) {
  const project = await db.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      color: true,
      status: true,
      createdAt: true,
      _count: { select: { submissions: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const mine =
    project.members.find((member) => member.user.id === user.id) ?? null;

  // Missing and forbidden are indistinguishable to a member.
  if (user.role !== "ADMIN" && !mine) notFound();

  return {
    project,
    myRole: mine?.role ?? null,
    members: project.members.map(
      (member): ProjectMemberView => ({
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        addedAt: member.createdAt,
      }),
    ),
  };
}

/**
 * Slugs are generated once, at creation, and never change: project links get
 * pasted into chat and bookmarks.
 */
export async function createUniqueProjectSlug(name: string): Promise<string> {
  const base = slugify(name) || "project";
  let candidate = base;

  for (let suffix = 2; suffix <= 50; suffix += 1) {
    const taken = await db.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!taken) return candidate;

    candidate = `${base}-${suffix}`;
  }

  // Practically unreachable; keeps the unique constraint from ever throwing.
  return `${base}-${Date.now().toString(36)}`;
}

export async function listAdminProjects() {
  const projects = await db.project.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      color: true,
      status: true,
      updatedAt: true,
      _count: { select: { members: true, submissions: true } },
    },
  });

  return projects.map((project) => ({
    ...project,
    memberCount: project._count.members,
    submissionCount: project._count.submissions,
  }));
}

export async function getAdminProject(id: string) {
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      color: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { submissions: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const members = project.members.map(
    (member): ProjectMemberView & { isActive: boolean } => ({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      addedAt: member.createdAt,
      isActive: member.user.isActive,
    }),
  );

  // Only active accounts can be added; inactive ones keep existing membership
  // so attendance history stays readable.
  const assignable = await db.user.findMany({
    where: {
      isActive: true,
      memberships: { none: { projectId: id } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return { project, members, assignable };
}
