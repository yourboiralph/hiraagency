import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import { SubmissionCard } from "@/components/submission-card";
import {
  HiddenBadge,
  TaskOrderStatusBadge,
} from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/authz";
import { formatInstantDate, workDateToday } from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";
import { listProjectSubmissions } from "@/lib/submissions";
import { canManageTaskOrders, getTaskOrder } from "@/lib/task-orders";

import {
  setTaskOrderHiddenAction,
  setTaskOrderStatusAction,
} from "../actions";
import { DeleteTaskOrderButton } from "./delete-task-order-button";

export const metadata: Metadata = {
  title: "Task order",
};

export default async function TaskOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser();
  const { slug, id } = await params;
  const { submitted } = await searchParams;

  const { project, myRole } = await getProjectForUser(slug, user);
  const order = await getTaskOrder(project.id, id);

  if (!order) notFound();

  const canManage = canManageTaskOrders(user, myRole);

  // Hidden orders are invisible to members, including by direct URL.
  if (order.hidden && !canManage) notFound();

  const submissions = await listProjectSubmissions(project.id, {
    taskOrderId: order.id,
  });

  const today = workDateToday();
  const isOpen = order.status === "OPEN";
  const canSubmit =
    myRole !== null && project.status === "ACTIVE" && isOpen && !order.hidden;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/projects/${project.slug}`, label: project.name }}
        eyebrow="Task order"
        title={order.title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TaskOrderStatusBadge status={order.status} />
            {order.hidden ? <HiddenBadge /> : null}
            {canSubmit ? (
              <Link
                href={`/projects/${project.slug}/submit?taskOrderId=${order.id}`}
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
        <span className="[overflow-wrap:anywhere]">Opened by {order.createdBy.name}</span>
        <span>{formatInstantDate(order.createdAt)}</span>
        <span>
          {order.submissionCount}{" "}
          {order.submissionCount === 1 ? "submission" : "submissions"}
        </span>
        {isOpen ? null : <span>Closed for new work</span>}
      </div>

      <div className="space-y-3">
        <section
          aria-labelledby="brief-heading"
          className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        >
          <h2 id="brief-heading" className="text-sm font-medium">
            Brief
          </h2>

          {order.brief ? (
            <p className="mt-2 whitespace-pre-line text-sm [overflow-wrap:anywhere] text-muted-foreground">
              {order.brief}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No brief was provided. Ask the lead for the details before
              starting.
            </p>
          )}

          {canManage ? (
            <div className="mt-4 space-y-3 border-t border-border/70 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <form action={setTaskOrderStatusAction}>
                  <input type="hidden" name="taskOrderId" value={order.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={isOpen ? "CLOSED" : "OPEN"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    {isOpen ? (
                      <LockSimpleIcon aria-hidden="true" className="size-4" />
                    ) : (
                      <LockSimpleOpenIcon
                        aria-hidden="true"
                        className="size-4"
                      />
                    )}
                    {isOpen ? "Close" : "Reopen"}
                  </Button>
                </form>

                <form action={setTaskOrderHiddenAction}>
                  <input type="hidden" name="taskOrderId" value={order.id} />
                  <input
                    type="hidden"
                    name="hidden"
                    value={order.hidden ? "false" : "true"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    {order.hidden ? (
                      <EyeIcon aria-hidden="true" className="size-4" />
                    ) : (
                      <EyeSlashIcon aria-hidden="true" className="size-4" />
                    )}
                    {order.hidden ? "Show to members" : "Hide from members"}
                  </Button>
                </form>

                <DeleteTaskOrderButton
                  taskOrderId={order.id}
                  title={order.title}
                  submissionCount={order.submissionCount}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Hidden orders disappear from the project page and the submit
                form for members; leads and administrators still see them here.
                Deleting keeps attached submissions in the project feed.
              </p>
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="work-heading"
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
        >
          <header className="flex items-baseline justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <h2 id="work-heading" className="text-sm font-medium">
                Work on this order
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Newest work day first.
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
              <p className="text-sm font-medium">No work attached yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                {isOpen
                  ? "Members can submit links against this order."
                  : "This order is closed to new work."}
              </p>
              {canSubmit ? (
                <Link
                  href={`/projects/${project.slug}/submit?taskOrderId=${order.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Submit the first link
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2.5 p-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  today={today}
                  projectSlug={project.slug}
                  showHiddenTaskOrders={canManage}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
