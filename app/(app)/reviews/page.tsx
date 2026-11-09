import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyPanel } from "@/components/empty-panel";
import { LinkChips } from "@/components/link-chips";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { requireReviewer } from "@/lib/authz";
import { formatInstantDate, formatWorkDate } from "@/lib/date";
import { listPendingReviews, type ReviewItem } from "@/lib/reviews";

import { ReviewActions } from "./review-actions";

export const metadata: Metadata = {
  title: "Reviews",
};

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start gap-3">
        <UserAvatar
          name={item.author.name}
          image={item.author.image}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[15px] font-medium [overflow-wrap:anywhere]">
              {item.author.name}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              logged {formatInstantDate(item.createdAt)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/projects/${item.project.slug}`}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full"
                style={{ backgroundColor: item.project.color }}
              />
              {item.project.name}
            </Link>
            <span aria-hidden="true">·</span>
            <span>work date {formatWorkDate(item.workDate)}</span>
            {item.taskOrder ? (
              <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-xs text-info">
                {item.taskOrder.title}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-[15px] [overflow-wrap:anywhere]">
            {item.title}
          </p>

          {item.notes ? (
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">
              {item.notes}
            </p>
          ) : null}

          <LinkChips links={item.links} />

          {item.images.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.images.map((image) => (
                <li key={image.id}>
                  <a
                    href={`/api/media/${image.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block size-16 overflow-hidden rounded-md border border-border/70"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${image.key}`}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <ReviewActions
          submissionId={item.id}
          hasTaskOrder={Boolean(item.taskOrder)}
        />
      </div>
    </li>
  );
}

export default async function ReviewsPage() {
  const { user, projectIds } = await requireReviewer();
  const items = await listPendingReviews({ projectIds });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={user.role === "ADMIN" ? "Admin" : undefined}
        title="Reviews"
        description={
          user.role === "ADMIN"
            ? "Submitted work waiting for a decision. Oldest first."
            : "Work submitted to the projects you lead, waiting for a decision. Oldest first."
        }
        back={
          user.role === "ADMIN"
            ? { href: "/admin", label: "Admin" }
            : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyPanel
          icon={<CheckCircleIcon aria-hidden="true" className="size-5" />}
          title="Nothing to review"
          description="New submissions appear here as soon as a member adds them to a project."
          action={
            <Link
              href="/projects"
              className="text-[13px] font-medium text-primary hover:underline hover:underline-offset-4"
            >
              Go to projects
            </Link>
          }
        />
      ) : (
        <section aria-label="Pending submissions" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-medium text-muted-foreground">
              Pending
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {items.length}{" "}
              {items.length === 1 ? "submission" : "submissions"}
            </p>
          </div>

          <ul className="space-y-3">
            {items.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
