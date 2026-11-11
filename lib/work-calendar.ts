import "server-only";

import { addWorkDays, type WorkDate } from "@/lib/date";

/**
 * Calendar maths for the project work view. Everything works on `YYYY-MM-DD`
 * strings in UTC, the same way `lib/date` stores a workday, so the grid never
 * drifts a day on a machine in another timezone.
 */

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type CalendarDay = {
  date: WorkDate;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
};

const monthNameFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "long",
});

const shortWeekdayFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  weekday: "short",
});

export function monthKeyOf(workDate: WorkDate): string {
  return workDate.slice(0, 7);
}

export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + delta, 1))
    .toISOString()
    .slice(0, 7);
}

export function monthLabel(monthKey: string): { name: string; year: string } {
  const first = new Date(`${monthKey}-01T00:00:00.000Z`);

  return {
    name: monthNameFormatter.format(first),
    year: String(first.getUTCFullYear()),
  };
}

export function shortWeekday(workDate: WorkDate): string {
  return shortWeekdayFormatter.format(new Date(`${workDate}T00:00:00.000Z`));
}

/**
 * The cells a month needs, starting on the Sunday of the first week and
 * ending on the Saturday of the last one. Months take four to six rows.
 */
export function buildMonthGrid(
  monthKey: string,
  today: WorkDate,
): CalendarDay[] {
  const first = `${monthKey}-01`;
  const lead = new Date(`${first}T00:00:00.000Z`).getUTCDay();
  const start = addWorkDays(first, -lead);
  const cells = Math.ceil((lead + daysInMonth(monthKey)) / 7) * 7;

  return Array.from({ length: cells }, (_, index) => {
    const date = addWorkDays(start, index);

    return {
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      inMonth: monthKeyOf(date) === monthKey,
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

/** First and last cell of a month's grid, for a single counts query. */
export function monthGridRange(monthKey: string): {
  from: WorkDate;
  to: WorkDate;
} {
  const first = `${monthKey}-01`;
  const lead = new Date(`${first}T00:00:00.000Z`).getUTCDay();
  const from = addWorkDays(first, -lead);
  const cells = Math.ceil((lead + daysInMonth(monthKey)) / 7) * 7;

  return { from, to: addWorkDays(from, cells - 1) };
}

/**
 * Moving a month keeps the selected day-of-month when it exists (10 Nov ->
 * 10 Oct) and falls back to the month's last day (31 Mar -> 28 Feb). A target
 * in the future is clamped to today, and a next month past today is refused.
 */
export function shiftMonthKeepingDay(
  workDate: WorkDate,
  delta: number,
  today: WorkDate,
): WorkDate | null {
  const targetMonth = shiftMonth(monthKeyOf(workDate), delta);

  if (targetMonth > monthKeyOf(today)) return null;

  const day = Math.min(
    Number(workDate.slice(8, 10)),
    daysInMonth(targetMonth),
  );
  const candidate = `${targetMonth}-${String(day).padStart(2, "0")}`;

  return candidate > today ? today : candidate;
}
