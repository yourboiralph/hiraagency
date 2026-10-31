"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { createUniqueProjectSlug } from "@/lib/projects";
import { deleteObject, verifyUploadedImage } from "@/lib/storage";
import { fieldErrorsOf } from "@/lib/validation/errors";
import {
  memberSchema,
  projectIdSchema,
  projectSchema,
  projectStatusSchema,
} from "@/lib/validation/project";

export type ProjectFormState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
  /** Set by create only, so the dialog can offer the next step. */
  project?: { id: string; name: string; slug: string };
};

export type MemberFormState = {
  ok?: boolean;
  formError?: string;
};

/**
 * Everything that renders project data, in one place. `layout` covers the
 * dynamic project pages underneath without naming each one.
 */
function revalidateProjectSurfaces(projectId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/projects", "layout");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
}

export async function createProjectAction(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const admin = await requireAdmin();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const image = String(formData.get("image") ?? "").trim();
  if (image) {
    const stored = await verifyUploadedImage(image, `projects/${admin.id}`);
    if (!stored) {
      return {
        fieldErrors: { image: "Upload the picture again before saving." },
      };
    }
  }

  let created: { id: string; name: string; slug: string };

  try {
    const slug = await createUniqueProjectSlug(parsed.data.name);

    created = await db.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        image: image || null,
        slug,
        createdById: admin.id,
      },
      select: { id: true, name: true, slug: true },
    });
  } catch {
    return { formError: "The project could not be created. Try again." };
  }

  revalidateProjectSurfaces();
  return { ok: true, project: created };
}

export async function updateProjectAction(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const admin = await requireAdmin();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    color: formData.get("color"),
  });

  const id = projectIdSchema.safeParse({ projectId: formData.get("projectId") });
  if (!id.success) return { formError: "Missing project." };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const image = String(formData.get("image") ?? "").trim();

  if (image) {
    const stored = await verifyUploadedImage(image, `projects/${admin.id}`);
    if (!stored) {
      return {
        fieldErrors: { image: "Upload the picture again before saving." },
      };
    }
  }

  const existing = await db.project.findUnique({
    where: { id: id.data.projectId },
    select: { id: true, image: true },
  });

  if (!existing) return { formError: "That project no longer exists." };

  try {
    // The slug is intentionally absent: project URLs never change.
    await db.project.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        image: image || null,
      },
    });
  } catch {
    return { formError: "The changes could not be saved. Try again." };
  }

  // Best effort: drop the replaced picture so the bucket does not accumulate
  // abandoned objects.
  if (existing.image && existing.image !== image) {
    await deleteObject(existing.image);
  }

  revalidateProjectSurfaces(existing.id);
  return { ok: true };
}

export async function setProjectStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  try {
    await db.project.update({
      where: { id: parsed.data.projectId },
      data: { status: parsed.data.status },
    });
  } catch {
    // Project vanished between render and submit; the list will refresh.
    return;
  }

  revalidateProjectSurfaces(parsed.data.projectId);
}

export async function addMemberAction(
  _previous: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const admin = await requireAdmin();

  const parsed = memberSchema.safeParse({
    projectId: formData.get("projectId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const errors = fieldErrorsOf(parsed.error);
    return { formError: errors.userId ?? errors.role ?? "Choose a person." };
  }

  const [project, person] = await Promise.all([
    db.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: parsed.data.userId },
      select: { isActive: true },
    }),
  ]);

  if (!project) return { formError: "That project no longer exists." };
  if (!person?.isActive) {
    return { formError: "That account is not active any more." };
  }

  try {
    await db.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: parsed.data.userId,
        },
      },
      update: { role: parsed.data.role },
      create: {
        projectId: project.id,
        userId: parsed.data.userId,
        role: parsed.data.role,
        addedById: admin.id,
      },
    });
  } catch {
    return { formError: "That person could not be added. Try again." };
  }

  revalidateProjectSurfaces(project.id);
  return { ok: true };
}

export async function setMemberRoleAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = memberSchema.safeParse({
    projectId: formData.get("projectId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return;

  try {
    await db.projectMember.update({
      where: {
        projectId_userId: {
          projectId: parsed.data.projectId,
          userId: parsed.data.userId,
        },
      },
      data: { role: parsed.data.role },
    });
  } catch {
    // Membership removed between render and submit.
    return;
  }

  revalidateProjectSurfaces(parsed.data.projectId);
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = memberSchema
    .pick({ projectId: true, userId: true })
    .safeParse({
      projectId: formData.get("projectId"),
      userId: formData.get("userId"),
    });

  if (!parsed.success) return;

  try {
    await db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: parsed.data.projectId,
          userId: parsed.data.userId,
        },
      },
    });
  } catch {
    return;
  }

  revalidateProjectSurfaces(parsed.data.projectId);
}
