"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/authz";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await markAllNotificationsRead(user.id);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
