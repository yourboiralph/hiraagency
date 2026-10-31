"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { fieldErrorsOf } from "@/lib/validation/errors";
import {
  taskOrderIdSchema,
  taskOrderSchema,
  taskOrderStatusSchema,
  taskOrderVisibilitySchema,
} from "@/lib/validation/task-order";

export type TaskOrderState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Leads and administrators only. Checked here, server-side, because the button
 * is only a convenience.
 */
async function loadManageableProject(projectId: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      slug: true,
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });

  if (!project) {
    return { ok: false as const, message: "That project no longer exists." };
  }

  const projectRole = project.members[0]?.role ?? null;

  if (user.role !== "ADMIN" && projectRole !== "LEAD") {
    return {
      ok: false as const,
      message: "Only project leads and administrators can manage task orders.",
    };
  }

  return { ok: true as const, user, project };
}

export async function createTaskOrderAction(
  _previous: TaskOrderState,
  formData: FormData,
): Promise<TaskOrderState> {
  const parsed = taskOrderSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    brief: formData.get("brief") ?? "",
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const access = await loadManageableProject(parsed.data.projectId);
  if (!access.ok) return { formError: access.message };

  let created: { id: string };

  try {
    created = await db.taskOrder.create({
      data: {
        projectId: access.project.id,
        title: parsed.data.title,
        brief: parsed.data.brief,
        createdById: access.user.id,
      },
      select: { id: true },
    });
  } catch {
    return { formError: "The task order could not be created. Try again." };
  }

  revalidatePath(`/projects/${access.project.slug}`, "layout");
  redirect(`/projects/${access.project.slug}/task-orders/${created.id}`);
}

export async function setTaskOrderStatusAction(
  formData: FormData,
): Promise<void> {
  const parsed = taskOrderStatusSchema.safeParse({
    taskOrderId: formData.get("taskOrderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const order = await db.taskOrder.findUnique({
    where: { id: parsed.data.taskOrderId },
    select: {
      id: true,
      projectId: true,
      project: { select: { slug: true } },
    },
  });

  if (!order) return;

  const access = await loadManageableProject(order.projectId);
  if (!access.ok) return;

  await db.taskOrder.update({
    where: { id: order.id },
    data: { status: parsed.data.status },
  });

  // Covers the project page, the order page and the submit form's order list.
  revalidatePath(`/projects/${order.project.slug}`, "layout");
  revalidatePath("/admin/reviews");
}

export async function setTaskOrderHiddenAction(
  formData: FormData,
): Promise<void> {
  const parsed = taskOrderVisibilitySchema.safeParse({
    taskOrderId: formData.get("taskOrderId"),
    hidden: formData.get("hidden"),
  });

  if (!parsed.success) return;

  const order = await db.taskOrder.findUnique({
    where: { id: parsed.data.taskOrderId },
    select: {
      id: true,
      projectId: true,
      project: { select: { slug: true } },
    },
  });

  if (!order) return;

  const access = await loadManageableProject(order.projectId);
  if (!access.ok) return;

  await db.taskOrder.update({
    where: { id: order.id },
    data: { hidden: parsed.data.hidden === "true" },
  });

  revalidatePath(`/projects/${order.project.slug}`, "layout");
  revalidatePath("/admin/reviews");
}

export async function deleteTaskOrderAction(
  _previous: TaskOrderState,
  formData: FormData,
): Promise<TaskOrderState> {
  const parsed = taskOrderIdSchema.safeParse({
    taskOrderId: formData.get("taskOrderId"),
  });

  if (!parsed.success) return { formError: "Missing task order." };

  const order = await db.taskOrder.findUnique({
    where: { id: parsed.data.taskOrderId },
    select: {
      id: true,
      projectId: true,
      project: { select: { slug: true } },
    },
  });

  if (!order) return { formError: "That task order no longer exists." };

  const access = await loadManageableProject(order.projectId);
  if (!access.ok) return { formError: access.message };

  try {
    // Submission.taskOrderId is `onDelete: SetNull`, so attached work stays in
    // the project feed; it simply loses the order link.
    await db.taskOrder.delete({ where: { id: order.id } });
  } catch {
    return { formError: "The task order could not be deleted. Try again." };
  }

  revalidatePath(`/projects/${order.project.slug}`, "layout");
  revalidatePath("/admin/reviews");

  redirect(`/projects/${order.project.slug}`);
}
