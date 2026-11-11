import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDotsIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  PlusIcon,
  RowsIcon,
} from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import {
  HiddenBadge,
  ProjectStatusBadge,
  TaskOrderStatusBadge,
} from "@/components/status-badge";
import { SubmissionCard } from "@/components/submission-card";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { canViewSubmissionDetails, requireUser } from "@/lib/authz";
import {
  formatInstantDate,
  parseWorkDate,
  workDateLabel,
  workDateToday,
} from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";
import type { SubmissionStatus } from "@/lib/generated/prisma/enums";
import {
  countProjectSubmissionsByWorkDate,
  listProjectSubmissions,
  type FeedSubmission,
} from "@/lib/submissions";
import { cn } from "@/lib/utils";
import { canManageTaskOrders, listTaskOrders } from "@/lib/task-orders";
import { monthGridRange, monthKeyOf } from "@/lib/work-calendar";

import { NewTaskOrderDialog } from "./task-orders/new-task-order-dialog";
import { WorkCalendar } from "./work-calendar";

export const metadata: Metadata = {
  title: "Project",
};

type FeedFilter = "pending" | "approved" | "all";

const FEED_FILTERS: { value: FeedFilter; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "all", label: "All" },
];

const FEED_STATUSES: Record<FeedFilter, SubmissionStatus[] | undefined> = {
  pending: ["PENDING"],
  approved: ["APPROVED"],
  all: undefined,
};

function parseFeedFilter(value: string | undefined): FeedFilter {
  return value === "approved" || value === "all" ? value : "pending";
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    submitted?: string;
    status?: string;
    view?: string;
    day?: string;
  }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { submitted, status, view, day } = await searchParams;
  const { project, myRole, members } = await getProjectForUser(slug, user);

  const filter = parseFeedFilter(status);
  const calendarView = view !== "feed";
  const canViewAllDetails = canViewSubmissionDetails(user, myRole);
  // Ordinary members get a personal activity calendar. Leads and admins
  // review the team, so their markers stay project-wide.
  const personalActivity = !canViewAllDetails;

  const today = workDateToday();
  const requestedDay = day ? parseWorkDate(day) : null;
  const selectedDay =
    requestedDay && requestedDay <= today ? requestedDay : today;
  const monthKey = monthKeyOf(selectedDay);
  const canSubmit = myRole !== null && project.status === "ACTIVE";
  const canManageOrders = canManageTaskOrders(user, myRole);

  const [submissions, monthCounts, daySubmissions, taskOrders] =
    await Promise.all([
      calendarView
        ? Promise.resolve<FeedSubmission[]>([])
        : listProjectSubmissions(project.id, {
            statuses: FEED_STATUSES[filter],
            canViewAllDetails,
            viewerId: user.id,
          }),
      calendarView
        ? countProjectSubmissionsByWorkDate(
            project.id,
            monthGridRange(monthKey),
            personalActivity ? { authorId: user.id } : {},
          )
        : Promise.resolve(new Map<string, number>()),
      calendarView
        ? listProjectSubmissions(project.id, {
            workDate: selectedDay,
            canViewAllDetails,
            viewerId: user.id,
          })
        : Promise.resolve<FeedSubmission[]>([]),
      listTaskOrders(project.id, {
        includeHidden: canManageOrders,
      }),
    ]);

  const grouped = new Map<string, FeedSubmission[]>();
  for (const submission of submissions) {
    const group = grouped.get(submission.workDate) ?? [];
    group.push(submission);
    grouped.set(submission.workDate, group);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: "/projects", label: "Projects" }}
        eyebrow="Project"
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {canSubmit ? (
              <Link
                href={`/projects/${project.slug}/submit`}
                className={buttonVariants({ size: "sm" })}
              >
                <PlusIcon aria-hidden="true" className="size-4" />
                Submit work
              </Link>
            ) : null}
          </div>
        }
      />

      {submitted === "1" ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-success/40 bg-success/10 p-4 text-sm"
        >
          <CheckCircleIcon
            weight="fill"
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-success"
          />
          <p>Work submitted. An administrator will review it.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-mono">/{project.slug}</span>
        <span>
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
        <span>
          {project._count.submissions}{" "}
          {project._count.submissions === 1 ? "submission" : "submissions"}
        </span>
        <span>
          {user.role === "ADMIN"
            ? "You are an administrator"
            : myRole === "LEAD"
              ? "You are lead on this project"
              : "You are a member"}
        </span>
      </div>

      <section aria-labelledby="task-orders-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="task-orders-heading"
              className="text-[17px] font-medium tracking-[-0.01em]"
            >
              Task orders
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Briefs members attach their work to.
            </p>
          </div>
          {canManageOrders ? (
            <NewTaskOrderDialog projectId={project.id} />
          ) : null}
        </div>

        {taskOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-7 text-[15px] leading-relaxed text-muted-foreground">
            No task orders yet.
            {canManageOrders
              ? " Create one to give the team a brief to work against."
              : " A lead can create one when there is a brief."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {taskOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/projects/${project.slug}/task-orders/${order.id}`}
                  className="card-lift group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-start gap-2">
                    <ClipboardTextIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <p className="min-w-0 flex-1 truncate text-[15px] font-medium">
                      {order.title}
                    </p>
                    <span className="flex shrink-0 items-center gap-1">
                      {order.hidden ? <HiddenBadge /> : null}
                      <TaskOrderStatusBadge status={order.status} />
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {order.brief ?? "No brief."}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {order.submissionCount}{" "}
                      {order.submissionCount === 1
                        ? "submission"
                        : "submissions"}
                    </span>
                    <span>Opened {formatInstantDate(order.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section
          aria-labelledby="work-heading"
          className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2"
        >
          <header className="space-y-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id="work-heading"
                  className="text-[17px] font-medium tracking-[-0.01em]"
                >
                  {calendarView
                    ? personalActivity
                      ? "Your work calendar"
                      : "Work calendar"
                    : "Work feed"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {calendarView
                    ? personalActivity
                      ? "Dots mark the days you submitted. Pick one to open it."
                      : "Pick a day to see the work logged on it."
                    : "Grouped by workday, newest first."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!calendarView && submissions.length > 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {submissions.length} shown
                  </p>
                ) : null}

                <div
                  role="group"
                  aria-label="Work view"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
                >
                  <Link
                    href={
                      filter === "pending"
                        ? `/projects/${project.slug}?view=feed`
                        : `/projects/${project.slug}?view=feed&status=${filter}`
                    }
                    scroll={false}
                    aria-current={!calendarView ? "page" : undefined}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      !calendarView
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <RowsIcon aria-hidden="true" className="size-3.5" />
                    Feed
                  </Link>
                  <Link
                    href={
                      calendarView
                        ? `/projects/${project.slug}?view=calendar&day=${selectedDay}`
                        : `/projects/${project.slug}?view=calendar`
                    }
                    scroll={false}
                    aria-current={calendarView ? "page" : undefined}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      calendarView
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CalendarDotsIcon
                      aria-hidden="true"
                      className="size-3.5"
                    />
                    Calendar
                  </Link>
                </div>
              </div>
            </div>

            {!calendarView ? (
              <nav
                aria-label="Filter work by status"
                className="flex flex-wrap gap-1"
              >
                {FEED_FILTERS.map((option) => {
                  const active = option.value === filter;
                  const href =
                    option.value === "pending"
                      ? `/projects/${project.slug}?view=feed`
                      : `/projects/${project.slug}?view=feed&status=${option.value}`;

                  return (
                    <Link
                      key={option.value}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        active
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </header>

          {calendarView ? (
            <WorkCalendar
              projectSlug={project.slug}
              selectedDay={selectedDay}
              today={today}
              counts={monthCounts}
              submissions={daySubmissions}
              canSubmit={canSubmit}
              projectActive={project.status === "ACTIVE"}
              personal={personalActivity}
              canViewAllDetails={canViewAllDetails}
              showHiddenTaskOrders={canManageOrders}
              viewerId={user.id}
            />
          ) : submissions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              {project._count.submissions === 0 ? (
                <>
                  <p className="text-sm font-medium">No submissions yet</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    Work submitted for this project will appear here with its
                    links and review status.
                  </p>
                  {canSubmit ? (
                    <Link
                      href={`/projects/${project.slug}/submit`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Submit the first link
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    {filter === "pending"
                      ? "Nothing waiting for review"
                      : "No approved work yet"}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    {filter === "pending"
                      ? "Approved and rejected work is hidden by this filter."
                      : "Approved submissions are collected here."}
                  </p>
                  <Link
                    href={`/projects/${project.slug}?view=feed&status=all`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    View all work
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {[...grouped.entries()].map(([workDate, items]) => (
                <section
                  key={workDate}
                  aria-label={workDateLabel(workDate, today)}
                  className="px-5 py-4"
                >
                  <header className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="text-[15px] font-medium">
                      {workDateLabel(workDate, today)}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {items.length}{" "}
                      {items.length === 1 ? "submission" : "submissions"}
                    </p>
                  </header>
                  <ul className="space-y-2.5">
                    {items.map((submission) => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        today={today}
                        projectSlug={project.slug}
                        showHiddenTaskOrders={canManageOrders}
                        canViewAllDetails={canViewAllDetails}
                        viewerId={user.id}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside
          aria-labelledby="members-heading"
          className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
        >
          <header className="border-b border-border/70 px-5 py-4">
            <h2
              id="members-heading"
              className="text-[17px] font-medium tracking-[-0.01em]"
            >
              Members
            </h2>
          </header>
          <ul className="divide-y divide-border/70 px-5">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center gap-2.5 py-2.5"
              >
                <UserAvatar
                  name={member.name}
                  image={member.image}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">
                    {member.name}
                  </span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </span>
                {member.role === "LEAD" ? (
                  <Badge
                    variant="outline"
                    className="border-info/30 bg-info/10 text-info"
                  >
                    Lead
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
