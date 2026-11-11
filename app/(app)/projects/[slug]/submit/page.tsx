import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/authz";
import {
  MAX_BACKDATE_DAYS,
  addWorkDays,
  formatWorkDate,
  isAllowedWorkDate,
  parseWorkDate,
  workDateToday,
} from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";
import { listOpenTaskOrders } from "@/lib/task-orders";

import { SubmissionForm } from "./submission-form";

export const metadata: Metadata = {
  title: "Submit work",
};

export default async function SubmitWorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ taskOrderId?: string; workDate?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { taskOrderId, workDate } = await searchParams;
  const { project, myRole } = await getProjectForUser(slug, user);

  // Submitting is for members only; administrators can read every project but
  // do not get to author work on projects they are not part of.
  if (!myRole) notFound();

  const today = workDateToday();
  const minDate = addWorkDays(today, -MAX_BACKDATE_DAYS);

  // A day can arrive from the project calendar. Trust it only when it is a
  // real workdate inside the backdate window; otherwise the form opens today.
  const requestedDay = workDate ? parseWorkDate(workDate) : null;
  const initialWorkDate =
    requestedDay && isAllowedWorkDate(requestedDay, { today })
      ? requestedDay
      : null;
  const backHref = initialWorkDate
    ? `/projects/${project.slug}?view=calendar&day=${initialWorkDate}`
    : `/projects/${project.slug}`;

  // Preselect only when the id is one of this project's open orders: the query
  // string is user input.
  const openTaskOrders = await listOpenTaskOrders(project.id, user.id);
  const initialTaskOrderId = openTaskOrders.some(
    (order) => order.id === taskOrderId,
  )
    ? taskOrderId
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        back={{ href: backHref, label: project.name }}
        eyebrow="Submit work"
        title={
          initialWorkDate
            ? `Add links for ${formatWorkDate(initialWorkDate, "weekday")}`
            : "Add your links"
        }
        description="Pick the day the work belongs to, then add one or more links. Submit as often as the work needs."
      />

      {project.status === "ARCHIVED" ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
        >
          <WarningCircleIcon
            weight="fill"
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-warning"
          />
          <p>
            This project is archived. Ask an administrator to restore it before
            adding new work.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <SubmissionForm
            projectId={project.id}
            projectSlug={project.slug}
            today={today}
            minDate={minDate}
            maxBackdateDays={MAX_BACKDATE_DAYS}
            taskOrders={openTaskOrders}
            defaultTaskOrderId={initialTaskOrderId}
            defaultWorkDate={initialWorkDate ?? today}
            fromCalendar={initialWorkDate !== null}
          />
        </div>
      )}
    </div>
  );
}
