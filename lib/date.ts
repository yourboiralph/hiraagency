import "server-only";

/**
 * A "workday" is a calendar date in the agency's timezone, not UTC.
 * Stored as `YYYY-MM-DD` and persisted in Postgres as `DATE`.
 */
export type WorkDate = string;

export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Manila";

export const MAX_BACKDATE_DAYS = Number(process.env.MAX_BACKDATE_DAYS ?? 7);

const workDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: APP_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

/** The workday an instant falls on, in the agency timezone. */
export function workDateOf(instant: Date = new Date()): WorkDate {
  return workDateFormatter.format(instant);
}

/** Today's workday. Always call this on the server. */
export function workDateToday(): WorkDate {
  return workDateOf(new Date());
}

/** Strict `YYYY-MM-DD` parse. Rejects `2026-02-31` and friends. */
export function parseWorkDate(value: string): WorkDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== value) return null;

  return value;
}

/** Prisma's `@db.Date` columns take a Date at UTC midnight. */
export function toDbDate(workDate: WorkDate): Date {
  return new Date(`${workDate}T00:00:00.000Z`);
}

/** Inverse of `toDbDate`. Prisma returns UTC midnight for `@db.Date`. */
export function fromDbDate(value: Date): WorkDate {
  return value.toISOString().slice(0, 10);
}

export function addWorkDays(workDate: WorkDate, days: number): WorkDate {
  const d = toDbDate(workDate);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function diffWorkDays(from: WorkDate, to: WorkDate): number {
  const ms = toDbDate(to).getTime() - toDbDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * A submission may target today or up to `maxDays` in the past.
 * Future dates are never allowed.
 */
export function isAllowedWorkDate(
  workDate: WorkDate,
  options: { maxBackdateDays?: number; today?: WorkDate } = {},
): boolean {
  const { maxBackdateDays = MAX_BACKDATE_DAYS, today = workDateToday() } = options;
  const delta = diffWorkDays(workDate, today);

  return delta >= 0 && delta <= maxBackdateDays;
}

export function formatWorkDate(
  workDate: WorkDate,
  style: "short" | "long" | "weekday" | "full" = "short",
): string {
  const d = toDbDate(workDate);

  const options: Intl.DateTimeFormatOptions =
    style === "full"
      ? {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      : style === "long"
        ? { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }
        : style === "weekday"
          ? { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }
          : { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" };

  return new Intl.DateTimeFormat("en-PH", options).format(d);
}

/** Clock time of a timestamp, rendered in the agency timezone. */
export function formatTime(instant: Date): string {
  return timeFormatter.format(instant);
}

const instantDateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Calendar date of a real timestamp (createdAt, reviewedAt) in Manila. */
export function formatInstantDate(instant: Date): string {
  return instantDateFormatter.format(instant);
}

/** Elapsed time, rounded to the minute: "45m", "9h 08m". */
export function formatDuration(from: Date, to: Date): string {
  const minutes = Math.max(
    0,
    Math.round((to.getTime() - from.getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return rest === 0 ? "under a minute" : `${rest}m`;

  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** Relative-ish label used in feeds: "Today", "Yesterday", else the date. */
export function workDateLabel(workDate: WorkDate, today: WorkDate = workDateToday()): string {
  const delta = diffWorkDays(workDate, today);

  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";

  return formatWorkDate(workDate, "weekday");
}

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  hour12: false,
});

/** Time-of-day greeting in the agency timezone, not the server's. */
export function greeting(instant: Date = new Date()): string {
  const hour = Number(hourFormatter.format(instant));

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
