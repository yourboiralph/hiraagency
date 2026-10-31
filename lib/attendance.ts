import "server-only";

import { toDbDate, workDateToday, type WorkDate } from "@/lib/date";
import { db } from "@/lib/db";

export type AttendanceRecord = {
  checkInAt: Date;
  checkOutAt: Date | null;
};

export type Attendee = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  attendance: AttendanceRecord | null;
};

/** Today's row for one person, or null if they have not checked in. */
export async function getAttendanceForUser(
  userId: string,
  workDate: WorkDate = workDateToday(),
): Promise<AttendanceRecord | null> {
  return db.attendance.findUnique({
    where: {
      userId_workDate: { userId, workDate: toDbDate(workDate) },
    },
    select: { checkInAt: true, checkOutAt: true },
  });
}

/**
 * Everyone who is expected today, with their attendance row if any.
 *
 * "Expected" is every active account — the administrator works too, and a
 * second rule ("only project members") would make the denominator depend on
 * membership that changes during the day.
 */
export async function getTodayRoster(workDate: WorkDate = workDateToday()) {
  const [people, records] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    db.attendance.findMany({
      where: { workDate: toDbDate(workDate) },
      select: { userId: true, checkInAt: true, checkOutAt: true },
    }),
  ]);

  const byUser = new Map(records.map((record) => [record.userId, record]));

  const rows: Attendee[] = people.map((person) => ({
    ...person,
    attendance: byUser.get(person.id) ?? null,
  }));

  const present = rows.filter((row) => row.attendance !== null);
  const absent = rows.filter((row) => row.attendance === null);

  return {
    workDate,
    rows,
    present,
    absent,
    total: rows.length,
    checkedIn: present.length,
  };
}
