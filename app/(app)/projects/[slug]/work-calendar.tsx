import Link from "next/link";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { SubmissionCard } from "@/components/submission-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  formatWorkDate,
  addWorkDays,
  isAllowedWorkDate,
  MAX_BACKDATE_DAYS,
  type WorkDate,
} from "@/lib/date";
import type { FeedSubmission } from "@/lib/submissions";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  monthKeyOf,
  monthLabel,
  shortWeekday,
  shiftMonthKeepingDay,
  WEEKDAY_LABELS,
} from "@/lib/work-calendar";

import { DayPanelShell } from "./day-panel-shell";

function calendarHref(projectSlug: string, day: WorkDate): string {
  return `/projects/${projectSlug}?view=calendar&day=${day}`;
}

function DotRow({ count, selected }: { count: number; selected: boolean }) {
  if (count === 0) return null;

  if (count > 3) {
    return (
      <span
        className={cn(
          "font-mono text-[10px] leading-none tabular-nums",
          selected ? "text-primary-foreground/85" : "text-primary/70",
        )}
      >
        {count}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-1 rounded-full",
            selected ? "bg-primary-foreground/75" : "bg-primary/55",
          )}
        />
      ))}
    </span>
  );
}

/**
 * Month grid plus the selected day's work. Every control is a link with the
 * day in the URL, so the browser back button, bookmarks and the submit form
 * all share one source of truth: the workday string.
 */
export function WorkCalendar({
  projectSlug,
  selectedDay,
  today,
  counts,
  submissions,
  canSubmit,
  projectActive,
  personal,
  canViewAllDetails,
  showHiddenTaskOrders,
  viewerId,
}: {
  projectSlug: string;
  selectedDay: WorkDate;
  today: WorkDate;
  counts: Map<WorkDate, number>;
  submissions: FeedSubmission[];
  canSubmit: boolean;
  projectActive: boolean;
  /** Ordinary members see only their own marks, so a dot always means "you". */
  personal: boolean;
  canViewAllDetails: boolean;
  showHiddenTaskOrders: boolean;
  viewerId: string;
}) {
  const monthKey = monthKeyOf(selectedDay);
  const { name: monthName, year } = monthLabel(monthKey);
  const days = buildMonthGrid(monthKey, today);
  const weeks = Array.from({ length: days.length / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  const monthTotal = days.reduce(
    (total, day) => (day.inMonth ? total + (counts.get(day.date) ?? 0) : total),
    0,
  );
  const activeDays = days.filter(
    (day) => day.inMonth && (counts.get(day.date) ?? 0) > 0,
  ).length;

  const previousMonth = shiftMonthKeepingDay(selectedDay, -1, today);
  const nextMonth = shiftMonthKeepingDay(selectedDay, 1, today);
  const previousDay = addWorkDays(selectedDay, -1);
  const nextDayDate = addWorkDays(selectedDay, 1);
  const hasNextDay = nextDayDate <= today;

  const isToday = selectedDay === today;
  const canSubmitForDay =
    canSubmit && isAllowedWorkDate(selectedDay, { today });
  const submitBlockedMessage = !projectActive
    ? "This project is archived, so new work is closed."
    : !canSubmit
      ? "Only project members can add work to this project."
      : `Submissions open for today and the last ${MAX_BACKDATE_DAYS} days.`;
  const pendingCount = submissions.filter(
    (submission) => submission.status === "PENDING",
  ).length;
  const authorCount = new Set(submissions.map((s) => s.author.id)).size;

  const summary =
    submissions.length === 0
      ? "No work was logged on this day."
      : `${submissions.length} ${
          submissions.length === 1 ? "submission" : "submissions"
        } from ${authorCount} ${authorCount === 1 ? "person" : "people"}${
          pendingCount > 0
            ? ` · ${pendingCount} awaiting review`
            : " · all reviewed"
        }`;

  return (
    <div>
      <div className="px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-2xl font-medium tracking-[-0.03em]">
                {monthName}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {year}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {monthTotal === 0
                ? personal
                  ? "No work logged by you this month."
                  : "No work logged this month."
                : personal
                  ? `You logged ${monthTotal} ${
                      monthTotal === 1 ? "submission" : "submissions"
                    } across ${activeDays} ${activeDays === 1 ? "day" : "days"}`
                  : `${monthTotal} ${
                      monthTotal === 1 ? "submission" : "submissions"
                    } across ${activeDays} ${activeDays === 1 ? "day" : "days"}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {previousMonth ? (
              <Link
                href={calendarHref(projectSlug, previousMonth)}
                scroll={false}
                aria-label="Previous month"
                title="Previous month"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                })}
              >
                <CaretLeftIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
            <Link
              href={`/projects/${projectSlug}?view=calendar`}
              scroll={false}
              aria-current={isToday ? "date" : undefined}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Today
            </Link>
            {nextMonth ? (
              <Link
                href={calendarHref(projectSlug, nextMonth)}
                scroll={false}
                aria-label="Next month"
                title="Next month"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                })}
              >
                <CaretRightIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title="You are on the current month"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "pointer-events-none opacity-40",
                )}
              >
                <CaretRightIcon aria-hidden="true" className="size-4" />
              </span>
            )}
          </div>
        </div>

        <table className="mt-4 w-full table-fixed border-separate border-spacing-1 sm:border-spacing-1.5">
          <caption className="sr-only">
            Work calendar for {monthName} {year}. Each day links to the work
            logged on it.
          </caption>
          <thead>
            <tr>
              {WEEKDAY_LABELS.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="pb-1 text-center font-mono text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]?.date ?? "week"}>
                {week.map((day) => {
                  const count = counts.get(day.date) ?? 0;
                  const selected = day.date === selectedDay;
                  const label = `${formatWorkDate(day.date, "full")}${
                    count > 0
                      ? `, ${count} ${count === 1 ? "submission" : "submissions"}`
                      : ""
                  }`;

                  return (
                    <td key={day.date} className="p-0 align-top">
                      {day.isFuture ? (
                        <span
                          aria-disabled="true"
                          className="flex h-12 w-full flex-col items-center justify-between rounded-lg border border-transparent p-1.5 text-muted-foreground/30 select-none sm:h-14 sm:p-2"
                        >
                          <span className="font-mono text-[12px] leading-none tabular-nums sm:text-[13px]">
                            {day.dayOfMonth}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={calendarHref(projectSlug, day.date)}
                          scroll={false}
                          prefetch={false}
                          aria-label={label}
                          aria-current={selected ? "date" : undefined}
                          className={cn(
                            "group relative flex h-12 w-full flex-col items-center justify-between rounded-lg border p-1.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:h-14 sm:p-2",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : cn(
                                  "border-transparent hover:border-border hover:bg-muted",
                                  day.inMonth
                                    ? "bg-foreground/[0.03] text-foreground"
                                    : "text-muted-foreground/45",
                                  count > 0 &&
                                    "border-primary/15 bg-primary/[0.07]",
                                  day.isToday &&
                                    !selected &&
                                    "ring-1 ring-primary/30 ring-inset",
                                ),
                          )}
                        >
                          <span
                            className={cn(
                              "text-center font-mono text-[12px] leading-none tabular-nums sm:text-[13px]",
                              selected && "font-medium",
                              day.isToday && !selected && "font-semibold",
                            )}
                          >
                            {day.dayOfMonth}
                          </span>
                          <span className="flex h-2 items-center justify-center">
                            <DotRow count={count} selected={selected} />
                          </span>
                        </Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {personal
            ? "Each day shows what you logged. Pick a day to open it."
            : "Each day shows how many submissions were logged. Pick a day to open it."}
        </p>
      </div>

      <DayPanelShell
        day={selectedDay}
        className="mt-5 border-t border-border/70 bg-muted/25"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-mono text-[9px] leading-none tracking-[0.14em] uppercase opacity-70">
                {shortWeekday(selectedDay)}
              </span>
              <span className="mt-0.5 text-xl leading-none font-medium tracking-[-0.02em] tabular-nums">
                {Number(selectedDay.slice(8, 10))}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] leading-snug font-medium tracking-[-0.01em]">
                  {formatWorkDate(selectedDay, "full")}
                </h3>
                {isToday ? (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    Today
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1">
              {previousDay ? (
                <Link
                  href={previousDay}
                  scroll={false}
                  aria-label="Previous day"
                  title="Previous day"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                  })}
                >
                  <CaretLeftIcon aria-hidden="true" className="size-4" />
                </Link>
              ) : null}
              {hasNextDay ? (
                <Link
                  href={calendarHref(projectSlug, nextDayDate)}
                  scroll={false}
                  aria-label="Next day"
                  title="Next day"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                  })}
                >
                  <CaretRightIcon aria-hidden="true" className="size-4" />
                </Link>
              ) : null}
            </div>

            {canSubmitForDay ? (
              <Link
                href={`/projects/${projectSlug}/submit?workDate=${selectedDay}`}
                className={buttonVariants({ size: "sm" })}
              >
                <PlusIcon aria-hidden="true" className="size-4" />
                Submit work
              </Link>
            ) : null}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
              <CalendarBlankIcon
                weight="duotone"
                aria-hidden="true"
                className="mx-auto size-7 text-muted-foreground/60"
              />
              <p className="mt-2.5 text-sm font-medium">
                {isToday ? "Nothing logged yet today" : "No work on this day"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {canSubmitForDay
                  ? "Add the links for what you finished. The date is already filled in for this day."
                  : submitBlockedMessage}
              </p>
              {canSubmitForDay ? (
                <Link
                  href={`/projects/${projectSlug}/submit?workDate=${selectedDay}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-4",
                  )}
                >
                  <PlusIcon aria-hidden="true" className="size-4" />
                  Submit work
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <ul className="space-y-2.5 px-5 pb-5">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                today={today}
                projectSlug={projectSlug}
                showHiddenTaskOrders={showHiddenTaskOrders}
                canViewAllDetails={canViewAllDetails}
                viewerId={viewerId}
              />
            ))}
          </ul>
        )}
      </DayPanelShell>
    </div>
  );
}
