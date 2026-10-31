"use server";

import { requireAdmin, requireUser } from "@/lib/authz";
import {
  MAX_AVATAR_BYTES,
  MAX_IMAGE_BYTES,
  buildStorageKey,
  isStorageConfigured,
  isSupportedImageType,
  presignUpload,
} from "@/lib/storage";

export type UploadTarget =
  | { ok: true; key: string; uploadUrl: string }
  | { ok: false; error: string };

const LIMITS = {
  avatar: MAX_AVATAR_BYTES,
  project: MAX_IMAGE_BYTES,
  submission: MAX_IMAGE_BYTES,
} as const;

/**
 * The browser uploads straight to the bucket, so Vercel's request-body limit
 * never applies. This only mints a short-lived PUT URL for a key scoped to the
 * signed-in user; persistence re-checks the key afterwards.
 */
export async function createUploadTargetAction(input: {
  kind: keyof typeof LIMITS;
  contentType: string;
  size: number;
}): Promise<UploadTarget> {
  if (!isStorageConfigured()) {
    return { ok: false, error: "Image storage is not configured yet." };
  }

  const { kind } = input;

  if (!isSupportedImageType(input.contentType)) {
    return { ok: false, error: "Use a JPEG, PNG or WebP image." };
  }

  const limit = LIMITS[kind];
  if (!limit) return { ok: false, error: "Unknown upload type." };

  if (
    !Number.isFinite(input.size) ||
    input.size <= 0 ||
    input.size > limit
  ) {
    return {
      ok: false,
      error: `Images must be ${Math.round(limit / 1024 / 1024)} MB or smaller.`,
    };
  }

  // Project covers are managed from the admin screens.
  const user = kind === "project" ? await requireAdmin() : await requireUser();

  const prefix =
    kind === "avatar"
      ? `avatars/${user.id}`
      : kind === "project"
        ? `projects/${user.id}`
        : `submissions/${user.id}`;

  try {
    const key = buildStorageKey(prefix, input.contentType);
    const uploadUrl = await presignUpload(key, input.contentType);
    return { ok: true, key, uploadUrl };
  } catch {
    return { ok: false, error: "Could not prepare the upload. Try again." };
  }
}
