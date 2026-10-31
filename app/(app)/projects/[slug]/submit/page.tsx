import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/authz";
import { MAX_BACKDATE_DAYS, addWorkDays, workDateToday } from "@/lib/date";
import { getProjectForUser } from "@/lib/projects";

import { SubmissionForm } from "./submission-form";

export const metadata: Metadata = {
  title: "Submit work",
};

export default async function SubmitWorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { project, myRole } = await getProjectForUser(slug, user);

  // Submitting is for members only; administrators can read every project but
  // do not get to author work on projects they are not part of.
  if (!myRole) notFound();

  const today = workDateToday();
  const minDate = addWorkDays(today, -MAX_BACKDATE_DAYS);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        back={{ href: `/projects/${project.slug}`, label: project.name }}
        eyebrow="Submit work"
        title="Add your links"
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
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
          <SubmissionForm
            projectId={project.id}
            projectSlug={project.slug}
            today={today}
            minDate={minDate}
            maxBackdateDays={MAX_BACKDATE_DAYS}
          />
        </div>
      )}
    </div>
  );
}
