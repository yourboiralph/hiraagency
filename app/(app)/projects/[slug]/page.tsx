import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { LinkChips } from "@/components/link-chips";
import { PageHeader } from "@/components/page-header";
import {
  ProjectStatusBadge,
  SubmissionStatusBadge,
} from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/authz";
import {
  formatInstantDate,
  formatTime,
  workDateLabel,
  workDateToday,
} from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";
import {
  listProjectSubmissions,
  type FeedSubmission,
} from "@/lib/submissions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Project",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SubmissionItem({
  submission,
  today,
}: {
  submission: FeedSubmission;
  today: string;
}) {
  const loggedAt =
    submission.workDate === today
      ? formatTime(submission.createdAt)
      : formatInstantDate(submission.createdAt);

  return (
    <li className="rounded-lg border border-border/70 p-3">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-medium"
        >
          {initials(submission.author.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium">{submission.author.name}</p>
            <span className="font-mono text-[11px] text-muted-foreground">
              logged {loggedAt}
            </span>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          <p className="mt-1.5 text-sm">{submission.title}</p>

          {submission.notes ? (
            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
              {submission.notes}
            </p>
          ) : null}

          <LinkChips links={submission.links} />

          {submission.reviewNote ? (
            <p
              className={cn(
                "mt-2 rounded-md px-2 py-1.5 text-xs",
                submission.status === "NEEDS_REVISION"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/50 text-muted-foreground",
              )}
            >
              <span className="font-medium">Reviewer:</span>{" "}
              {submission.reviewNote}
            </p>
          ) : null}

          {submission.status !== "PENDING" ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {submission.status === "APPROVED" ? "Approved" : "Sent back"} by{" "}
              {submission.reviewer?.name ?? "an administrator"}
              {submission.reviewedAt
                ? ` · ${formatInstantDate(submission.reviewedAt)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { submitted } = await searchParams;
  const { project, myRole, members } = await getProjectForUser(slug, user);

  const submissions = await listProjectSubmissions(project.id);
  const today = workDateToday();
  const canSubmit = myRole !== null && project.status === "ACTIVE";

  const grouped = new Map<string, FeedSubmission[]>();
  for (const submission of submissions) {
    const group = grouped.get(submission.workDate) ?? [];
    group.push(submission);
    grouped.set(submission.workDate, group);
  }

  return (
    <div className="space-y-6">
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
          className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
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

      <div className="grid items-start gap-3 lg:grid-cols-3">
        <section
          aria-labelledby="feed-heading"
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 lg:col-span-2"
        >
          <header className="flex items-baseline justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <h2 id="feed-heading" className="text-sm font-medium">
                Work feed
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Grouped by workday, newest first.
              </p>
            </div>
            {submissions.length > 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                {submissions.length} shown
              </p>
            ) : null}
          </header>

          {submissions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium">No submissions yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Work submitted for this project will appear here with its links
                and review status.
              </p>
              {canSubmit ? (
                <Link
                  href={`/projects/${project.slug}/submit`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Submit the first link
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {[...grouped.entries()].map(([workDate, items]) => (
                <section
                  key={workDate}
                  aria-label={workDateLabel(workDate, today)}
                  className="px-4 py-4"
                >
                  <header className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-medium">
                      {workDateLabel(workDate, today)}
                    </h3>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {items.length}{" "}
                      {items.length === 1 ? "submission" : "submissions"}
                    </p>
                  </header>
                  <ul className="space-y-2.5">
                    {items.map((submission) => (
                      <SubmissionItem
                        key={submission.id}
                        submission={submission}
                        today={today}
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
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
        >
          <header className="border-b border-border/70 px-4 py-3">
            <h2 id="members-heading" className="text-sm font-medium">
              Members
            </h2>
          </header>
          <ul className="divide-y divide-border/70 px-4">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center gap-2.5 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-medium"
                >
                  {initials(member.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{member.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
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
