"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authz";
import { toDbDate } from "@/lib/date";
import { db } from "@/lib/db";
import { MAX_SUBMISSION_IMAGES } from "@/lib/submission-constants";
import { verifyUploadedImage } from "@/lib/storage";
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
      select: { id: true, status: true, hidden: true },
    });

    if (!taskOrder) {
      return { formError: "That task order no longer exists." };
    }

    if (taskOrder.hidden) {
      return {
        formError:
          "That task order is hidden. Submit without it or pick another one.",
      };
    }

    if (taskOrder.status !== "OPEN") {
      return {
        formError:
          "That task order is closed. Submit without it or pick an open one.",
      };
    }

    // Rejection is final for this member on this order, but not for their day.
    const rejectedBefore = await db.submission.findFirst({
      where: {
        taskOrderId: taskOrder.id,
        authorId: user.id,
        status: "REJECTED",
      },
      select: { id: true },
    });

    if (rejectedBefore) {
      return {
        formError:
          "Your work for this task order was rejected. A lead can post a new order.",
      };
    }

    taskOrderId = taskOrder.id;
  }

  const parsed = parseSubmission(formData);
  if (!parsed.ok) {
    return { formError: parsed.formError, fieldErrors: parsed.fieldErrors };
  }

  const imageKeys = formData
    .getAll("imageKey")
    .map((value) => String(value))
    .filter(Boolean);

  if (imageKeys.length > MAX_SUBMISSION_IMAGES) {
    return {
      formError: `Add at most ${MAX_SUBMISSION_IMAGES} pictures per submission.`,
    };
  }

  // Keys are user input too: confirm each object exists and belongs to this
  // author before writing it into the submission.
  for (const key of imageKeys) {
    const image = await verifyUploadedImage(key, `submissions/${user.id}`);
    if (!image) {
      return {
        formError: "One of the pictures is no longer available. Re-upload it.",
      };
    }
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
        images: {
          create: imageKeys.map((key, position) => ({ key, position })),
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
