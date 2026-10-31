"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authz";
import { toDbDate } from "@/lib/date";
import { db } from "@/lib/db";
import { parseSubmission } from "@/lib/validation/submission";

export type SubmissionFormState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
};

export async function createSubmissionAction(
  _previous: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const user = await requireUser();

  const projectId = String(formData.get("projectId") ?? "");

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      slug: true,
      status: true,
      members: {
        where: { userId: user.id },
        select: { userId: true },
      },
    },
  });

  if (!project) return { formError: "That project no longer exists." };

  // Submitting is a member action, administrators included. Visibility and
  // authorship are separate rights on purpose.
  if (project.members.length === 0) {
    return { formError: "You are not a member of this project." };
  }

  if (project.status !== "ACTIVE") {
    return {
      formError:
        "This project is archived. Ask an administrator to restore it before adding work.",
    };
  }

  // A task order is optional, but when given it must belong to this project
  // and still be open. The id arrives from a form field, so it is untrusted.
  const rawTaskOrderId = String(formData.get("taskOrderId") ?? "").trim();
  let taskOrderId: string | null = null;

  if (rawTaskOrderId) {
    const taskOrder = await db.taskOrder.findFirst({
      where: { id: rawTaskOrderId, projectId: project.id },
      select: { id: true, status: true },
    });

    if (!taskOrder) {
      return { formError: "That task order no longer exists." };
    }

    if (taskOrder.status !== "OPEN") {
      return {
        formError:
          "That task order is closed. Submit without it or pick an open one.",
      };
    }

    taskOrderId = taskOrder.id;
  }

  const parsed = parseSubmission(formData);
  if (!parsed.ok) {
    return { formError: parsed.formError, fieldErrors: parsed.fieldErrors };
  }

  try {
    await db.submission.create({
      data: {
        authorId: user.id,
        projectId: project.id,
        taskOrderId,
        workDate: toDbDate(parsed.data.workDate),
        title: parsed.data.title,
        notes: parsed.data.notes,
        links: {
          create: parsed.data.links.map((link, position) => ({
            ...link,
            position,
          })),
        },
      },
    });
  } catch {
    return { formError: "Your links could not be saved. Try again." };
  }

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  // Send people back to the order they were filling when that is the context.
  redirect(
    taskOrderId
      ? `/projects/${project.slug}/task-orders/${taskOrderId}?submitted=1`
      : `/projects/${project.slug}?submitted=1`,
  );
}
