import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyPanel } from "@/components/empty-panel";
import { PageHeader } from "@/components/page-header";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/authz";
import { formatInstantDate, formatTime } from "@/lib/date";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

import { markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    listNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="New work submitted to projects you review."
        actions={
          <form action={markAllNotificationsReadAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={unread === 0}
            >
              <CheckCircleIcon aria-hidden="true" className="size-4" />
              Mark all as read
            </Button>
          </form>
        }
      />

      {items.length === 0 ? (
        <EmptyPanel
          icon={<BellIcon aria-hidden="true" className="size-5" />}
          title="No notifications yet"
          description="When someone submits work to a project you review, it appears here."
          action={
            <Link
              href="/reviews"
              className="text-[13px] font-medium text-primary hover:underline hover:underline-offset-4"
            >
              Open reviews
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const submission = item.submission;
            const unreadItem = item.readAt === null;

            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-card p-5",
                  unreadItem ? "border-primary/40" : "border-border",
                )}
              >
                {submission ? (
                  <Link
                    href="/reviews"
                    className="flex items-start gap-3 focus-visible:outline-none"
                  >
                    <UserAvatar
                      name={submission.author.name}
                      image={submission.author.image}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] [overflow-wrap:anywhere]">
                        <span className="font-medium">
                          {submission.author.name}
                        </span>{" "}
                        submitted{" "}
                        <span className="font-medium">
                          {submission.title}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {submission.project.name} ·{" "}
                        {formatInstantDate(item.createdAt)} at{" "}
                        {formatTime(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {unreadItem ? (
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full bg-primary"
                        />
                      ) : null}
                      {submission.status === "PENDING" ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          View
                        </span>
                      ) : (
                        <SubmissionStatusBadge status={submission.status} />
                      )}
                    </div>
                  </Link>
                ) : (
                  <p className="text-[15px] text-muted-foreground">
                    A submission was removed.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
