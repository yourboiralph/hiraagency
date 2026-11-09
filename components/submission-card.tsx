import Link from "next/link";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr";

import { LinkChips } from "@/components/link-chips";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { formatInstantDate, formatTime } from "@/lib/date";
import type { FeedSubmission } from "@/lib/submissions";
import { cn } from "@/lib/utils";

/** One submission, shared by the project feed and a task order's own list. */
export function SubmissionCard({
  submission,
  today,
  projectSlug,
  showHiddenTaskOrders = false,
}: {
  submission: FeedSubmission;
  today: string;
  projectSlug: string;
  /** Managers see the chip for hidden orders; members must not. */
  showHiddenTaskOrders?: boolean;
}) {
  const loggedAt =
    submission.workDate === today
      ? formatTime(submission.createdAt)
      : formatInstantDate(submission.createdAt);

  const decision =
    submission.status === "APPROVED"
      ? "Approved"
      : submission.status === "REJECTED"
        ? "Rejected"
        : "Sent back";

  return (
    <li className="rounded-xl border border-border/70 p-4">
      <div className="flex items-start gap-2.5">
        <UserAvatar
          name={submission.author.name}
          image={submission.author.image}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="[overflow-wrap:anywhere] text-[15px] font-medium">
              {submission.author.name}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              logged {loggedAt}
            </span>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {submission.taskOrder &&
          (!submission.taskOrder.hidden || showHiddenTaskOrders) ? (
            <Link
              href={`/projects/${projectSlug}/task-orders/${submission.taskOrder.id}`}
              className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-info/10 px-2 py-1 text-xs text-info transition-colors hover:bg-info/20"
            >
              <ClipboardTextIcon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{submission.taskOrder.title}</span>
            </Link>
          ) : null}

          <p className="mt-2 text-[15px] [overflow-wrap:anywhere]">
            {submission.title}
          </p>

          {submission.notes ? (
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">
              {submission.notes}
            </p>
          ) : null}

          <LinkChips links={submission.links} />

          {submission.images.length > 0 ? (
            <ul className="mt-2 grid max-w-md grid-cols-3 gap-1.5 sm:grid-cols-4">
              {submission.images.map((image) => (
                <li key={image.id}>
                  <a
                    href={`/api/media/${image.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square overflow-hidden rounded-md border border-border/70"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${image.key}`}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-[600ms] ease-out hover:scale-[1.03]"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {submission.reviewNote ? (
            <p
              className={cn(
                "mt-2 rounded-md px-2 py-1.5 text-[13px] [overflow-wrap:anywhere]",
                submission.status === "APPROVED"
                  ? "bg-muted/50 text-muted-foreground"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <span className="font-medium">Reviewer:</span>{" "}
              {submission.reviewNote}
            </p>
          ) : null}

          {submission.status !== "PENDING" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {decision} by {submission.reviewer?.name ?? "an administrator"}
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
