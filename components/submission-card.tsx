import Link from "next/link";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr";

import { LinkChips } from "@/components/link-chips";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { formatInstantDate, formatTime } from "@/lib/date";
import type { FeedSubmission } from "@/lib/submissions";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** One submission, shared by the project feed and a task order's own list. */
export function SubmissionCard({
  submission,
  today,
  projectSlug,
}: {
  submission: FeedSubmission;
  today: string;
  projectSlug: string;
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
            <p className="[overflow-wrap:anywhere] text-sm font-medium">
              {submission.author.name}
            </p>
            <span className="font-mono text-[11px] text-muted-foreground">
              logged {loggedAt}
            </span>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {submission.taskOrder ? (
            <Link
              href={`/projects/${projectSlug}/task-orders/${submission.taskOrder.id}`}
              className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-info/10 px-2 py-1 text-[11px] text-info transition-colors hover:bg-info/20"
            >
              <ClipboardTextIcon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{submission.taskOrder.title}</span>
            </Link>
          ) : null}

          <p className="mt-1.5 text-sm [overflow-wrap:anywhere]">{submission.title}</p>

          {submission.notes ? (
            <p className="mt-1 whitespace-pre-line text-xs [overflow-wrap:anywhere] text-muted-foreground">
              {submission.notes}
            </p>
          ) : null}

          <LinkChips links={submission.links} />

          {submission.reviewNote ? (
            <p
              className={cn(
                "mt-2 rounded-md px-2 py-1.5 text-xs [overflow-wrap:anywhere]",
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
