"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/authz";
import { toDbDate, workDateToday } from "@/lib/date";
import { db } from "@/lib/db";

export type AttendanceState = {
  ok?: boolean;
  error?: string;
};

function revalidateAttendance() {
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

/**
 * One row per person per Manila workday. `upsert` with an empty update makes a
 * double click or a second tab a no-op instead of an error — and it keeps the
 * original check-in time rather than moving it.
 */
export async function checkInAction(): Promise<AttendanceState> {
  const user = await requireUser();

  try {
    await db.attendance.upsert({
      where: {
        userId_workDate: {
          userId: user.id,
          workDate: toDbDate(workDateToday()),
        },
      },
      update: {},
      create: {
        userId: user.id,
        workDate: toDbDate(workDateToday()),
      },
    });
  } catch {
    return { error: "Check-in did not go through. Try again." };
  }

  revalidateAttendance();
  return { ok: true };
}

/**
 * Only fills a null `checkOutAt`, so a second click cannot overwrite the time
 * someone actually stopped. A missing row is not an error: there is simply
 * nothing to close.
 */
export async function checkOutAction(): Promise<AttendanceState> {
  const user = await requireUser();

  try {
    await db.attendance.updateMany({
      where: {
        userId: user.id,
        workDate: toDbDate(workDateToday()),
        checkOutAt: null,
      },
      data: { checkOutAt: new Date() },
    });
  } catch {
    return { error: "Check-out did not go through. Try again." };
  }

  revalidateAttendance();
  return { ok: true };
}
