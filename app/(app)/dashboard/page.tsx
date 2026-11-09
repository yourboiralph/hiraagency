import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CaretRightIcon,
  ClockCountdownIcon,
  FolderOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

import { ProjectMark } from "@/components/project-mark";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReviewerScope, requireUser } from "@/lib/authz";
import { getAttendanceForUser } from "@/lib/attendance";
import {
  APP_TIMEZONE,
  formatDuration,
  formatTime,
  formatWorkDate,
  greeting,
  toDbDate,
  workDateToday,
} from "@/lib/date";
import { db } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { countPendingReviews, listPendingReviews } from "@/lib/reviews";
import { listMySubmissionsForDate } from "@/lib/submissions";

import { CheckInCard } from "./check-in-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof FolderOpenIcon;
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-2 font-heading text-3xl font-medium leading-none tracking-[-0.03em]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        </div>
        <Icon
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground/70"
        />
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const reviewer = await getReviewerScope(user);

  const today = workDateToday();

  const [
    activeProjects,
    checkedInToday,
    pendingReviews,
    projects,
    attendance,
    todaySubmissions,
    waitingForReview,
  ] = await Promise.all([
    db.project.count({
      where: {
        status: "ACTIVE",
        ...(user.role === "ADMIN"
          ? {}
          : { members: { some: { userId: user.id } } }),
      },
    }),
    db.attendance.count({ where: { workDate: toDbDate(today) } }),
    reviewer.canReview
      ? countPendingReviews({ projectIds: reviewer.projectIds })
      : db.submission.count({
          where: { status: "PENDING", authorId: user.id },
        }),
    listProjects(user),
    getAttendanceForUser(user.id, today),
    listMySubmissionsForDate(user.id, today),
    reviewer.canReview
      ? listPendingReviews({ projectIds: reviewer.projectIds, take: 5 })
      : Promise.resolve([]),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-medium tracking-[-0.035em]">
          {greeting()}, {firstName}
        </h1>
        <p className="text-base text-muted-foreground">
          <span className="tabular">{formatWorkDate(today, "long")}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-mono text-xs">{APP_TIMEZONE}</span>
        </p>
      </header>

      <CheckInCard
        checkedInAt={attendance ? formatTime(attendance.checkInAt) : null}
        checkedOutAt={
          attendance?.checkOutAt ? formatTime(attendance.checkOutAt) : null
        }
        duration={
          attendance?.checkOutAt
            ? formatDuration(attendance.checkInAt, attendance.checkOutAt)
            : null
        }
        todayLabel={formatWorkDate(today, "long")}
      />

      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Active projects"
          value={activeProjects}
          hint={user.role === "ADMIN" ? "Across the agency" : "You are a member"}
          icon={FolderOpenIcon}
        />
        <Stat
          label="Checked in today"
          value={checkedInToday}
          hint="Agency-wide"
          icon={CalendarCheckIcon}
        />
        <Stat
          label="Pending review"
          value={pendingReviews}
          hint={
            reviewer.canReview
              ? "Waiting in the projects you review"
              : "Your submissions awaiting a decision"
          }
          icon={ClockCountdownIcon}
        />
      </section>

      {reviewer.canReview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waiting for review</CardTitle>
            <CardDescription>
              {pendingReviews === 0
                ? "Nothing waiting for a decision."
                : `${pendingReviews} ${
                    pendingReviews === 1 ? "submission needs" : "submissions need"
                  } a decision.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {waitingForReview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are all caught up.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {waitingForReview.map((item) => (
                  <li key={item.id}>
                    <Link
                      href="/reviews"
                      className="group -mx-1.5 flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary"
                    >
                      <UserAvatar
                        name={item.author.name}
                        image={item.author.image}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.author.name} · {item.project.name}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        Review
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/reviews"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open reviews
              <CaretRightIcon aria-hidden="true" className="size-3" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s work</CardTitle>
            <CardDescription>
              {todaySubmissions.length === 0
                ? "Nothing submitted yet for today."
                : `${todaySubmissions.length} ${
                    todaySubmissions.length === 1 ? "entry" : "entries"
                  } submitted today.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add the links as you finish them. Submitted work goes to an
                administrator for review.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {todaySubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/projects/${submission.project.slug}`}
                      className="group -mx-1.5 flex flex-wrap items-start gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary"
                    >
                      <ProjectMark
                        name={submission.project.name}
                        color={submission.project.color}
                        image={submission.project.image}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {submission.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {submission.project.name} ·{" "}
                          {submission._count.links}{" "}
                          {submission._count.links === 1 ? "link" : "links"}
                        </span>
                      </span>
                      <SubmissionStatusBadge status={submission.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {todaySubmissions.length === 0 ? "Submit work" : "Add more work"}
              <CaretRightIcon aria-hidden="true" className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your projects</CardTitle>
            <CardDescription>
              {user.role === "ADMIN"
                ? "Everything currently in the agency."
                : "The projects you have been added to."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {user.role === "ADMIN"
                  ? "No projects yet. Create the first one in Admin."
                  : "You are not on a project yet. Ask an administrator to add you."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {projects
                  .filter((project) => project.status === "ACTIVE")
                  .slice(0, 4)
                  .map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="group -mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary"
                    >
                      <ProjectMark
                        name={project.name}
                        color={project.color}
                        image={project.image}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {project.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {project.memberCount}
                      </span>
                      <CaretRightIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              All projects
              <CaretRightIcon aria-hidden="true" className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
