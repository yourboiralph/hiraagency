"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/authz";
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

const revisionSchema = idSchema.extend({
  note: z
    .string()
    .trim()
    .min(3, "Say what needs to change")
    .max(500, "Use 500 characters or fewer"),
});

function revalidateReviewSurfaces(projectSlug: string | null) {
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`);
}

/**
 * `updateMany` with `status: "PENDING"` in the filter makes the decision
 * atomic: two administrators clicking at once cannot overwrite each other,
 * and the loser gets a clear "already reviewed" message.
 */
export async function approveSubmissionAction(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin();

  const parsed = idSchema.safeParse({
    submissionId: formData.get("submissionId"),
  });
  if (!parsed.success) return { formError: "Missing submission." };

  const submission = await db.submission.findUnique({
    where: { id: parsed.data.submissionId },
    select: { id: true, project: { select: { slug: true } } },
  });

  if (!submission) return { formError: "That submission no longer exists." };

  const result = await db.submission.updateMany({
    where: { id: submission.id, status: "PENDING" },
    data: {
      status: "APPROVED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewNote: null,
    },
  });

  if (result.count === 0) {
    return { formError: "This submission was already reviewed." };
  }

  revalidateReviewSurfaces(submission.project.slug);
  return { ok: true };
}

export async function requestRevisionAction(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin();

  const parsed = revisionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    note: formData.get("note"),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const submission = await db.submission.findUnique({
    where: { id: parsed.data.submissionId },
    select: { id: true, project: { select: { slug: true } } },
  });

  if (!submission) return { formError: "That submission no longer exists." };

  const result = await db.submission.updateMany({
    where: { id: submission.id, status: "PENDING" },
    data: {
      status: "NEEDS_REVISION",
      reviewNote: parsed.data.note,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return { formError: "This submission was already reviewed." };
  }

  revalidateReviewSurfaces(submission.project.slug);
  return { ok: true };
}
