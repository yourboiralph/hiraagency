import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClipboardTextIcon,
  PlusIcon,
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
import { requireUser } from "@/lib/authz";
import {
  formatInstantDate,
  workDateLabel,
  workDateToday,
} from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";
import {
  listProjectSubmissions,
  type FeedSubmission,
} from "@/lib/submissions";
import { canManageTaskOrders, listTaskOrders } from "@/lib/task-orders";

import { NewTaskOrderDialog } from "./task-orders/new-task-order-dialog";

export const metadata: Metadata = {
  title: "Project",
};

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
  const canManageOrders = canManageTaskOrders(user, myRole);
  const taskOrders = await listTaskOrders(project.id, {
    includeHidden: canManageOrders,
  });

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

      <section aria-labelledby="task-orders-heading" className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="task-orders-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              Task orders
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Briefs members attach their work to.
            </p>
          </div>
          {canManageOrders ? (
            <NewTaskOrderDialog projectId={project.id} />
          ) : null}
        </div>

        {taskOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No task orders yet.
            {canManageOrders
              ? " Create one to give the team a brief to work against."
              : " A lead can create one when there is a brief."}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {taskOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/projects/${project.slug}/task-orders/${order.id}`}
                  className="group flex h-full flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-start gap-2">
                    <ClipboardTextIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {order.title}
                    </p>
                    <span className="flex shrink-0 items-center gap-1">
                      {order.hidden ? <HiddenBadge /> : null}
                      <TaskOrderStatusBadge status={order.status} />
                    </span>
                  </div>

                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {order.brief ?? "No brief."}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
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
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        today={today}
                        projectSlug={project.slug}
                        showHiddenTaskOrders={canManageOrders}
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
                <UserAvatar
                  name={member.name}
                  image={member.image}
                  size="sm"
                />
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
