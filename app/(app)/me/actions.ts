"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { deleteObject, verifyUploadedImage } from "@/lib/storage";

export type AvatarState = {
  ok?: boolean;
  formError?: string;
};

export async function updateAvatarAction(
  _previous: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const user = await requireUser();
  const key = String(formData.get("image") ?? "").trim();

  // The key arrives from a form field: make sure it is an uploaded image that
  // belongs to this person before storing it.
  if (key) {
    const stored = await verifyUploadedImage(key, `avatars/${user.id}`);
    if (!stored) {
      return {
        formError: "That picture is no longer available. Upload it again.",
      };
    }
  }

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });

  try {
    await db.user.update({
      where: { id: user.id },
      data: { image: key || null },
    });
  } catch {
    return { formError: "Your picture could not be saved. Try again." };
  }

  if (current?.image && current.image !== key) {
    await deleteObject(current.image);
  }

  // The sidebar and every avatar read from the session snapshot.
  revalidatePath("/", "layout");

  return { ok: true };
}
