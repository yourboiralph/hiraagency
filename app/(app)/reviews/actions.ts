"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { fieldErrorsOf } from "@/lib/validation/errors";

export type ReviewState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
};

const idSchema = z.object({
  submissionId: z.string().min(1, "Missing submission"),
});

const reasonSchema = idSchema.extend({
  note: z
    .string()
    .trim()
    .min(3, "Say why")
    .max(500, "Use 500 characters or fewer"),
});

/**
 * Administrators review everything; project leads review only submissions in
 * projects they lead. Checked here, close to the write, not just in the UI.
 */
async function loadReviewableSubmission(id: string) {
  const user = await requireUser();

  const submission = await db.submission.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      project: { select: { slug: true } },
    },
  });

  if (!submission) {
    return { ok: false as const, message: "That submission no longer exists." };
  }

  if (user.role !== "ADMIN") {
    const lead = await db.projectMember.findFirst({
      where: {
        projectId: submission.projectId,
        userId: user.id,
        role: "LEAD",
      },
      select: { projectId: true },
    });

    if (!lead) {
      return {
        ok: false as const,
        message: "Only project leads and administrators can review this work.",
      };
    }
  }

  return { ok: true as const, user, submission };
}

function revalidateReviewSurfaces(projectSlug: string | null) {
  revalidatePath("/reviews");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`, "layout");
}

async function decide(
  formData: FormData,
  status: "APPROVED" | "NEEDS_REVISION" | "REJECTED",
  note: string | null,
): Promise<ReviewState> {
  const parsed = idSchema.safeParse({
    submissionId: formData.get("submissionId"),
  });
  if (!parsed.success) return { formError: "Missing submission." };

  const loaded = await loadReviewableSubmission(parsed.data.submissionId);
  if (!loaded.ok) return { formError: loaded.message };

  const result = await db.submission.updateMany({
    where: { id: loaded.submission.id, status: "PENDING" },
    data: {
      status,
      reviewNote: note,
      reviewedById: loaded.user.id,
      reviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return { formError: "This submission was already reviewed." };
  }

  revalidateReviewSurfaces(loaded.submission.project.slug);
  return { ok: true };
}

export async function approveSubmissionAction(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  return decide(formData, "APPROVED", null);
}

export async function requestRevisionAction(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reasonSchema.safeParse({
    submissionId: formData.get("submissionId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  return decide(formData, "NEEDS_REVISION", parsed.data.note);
}

export async function rejectSubmissionAction(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reasonSchema.safeParse({
    submissionId: formData.get("submissionId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  return decide(formData, "REJECTED", parsed.data.note);
}
