import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyPanel } from "@/components/empty-panel";
import { LinkChips } from "@/components/link-chips";
import { PageHeader } from "@/components/page-header";
import { ProjectMark } from "@/components/project-mark";
import { requireAdmin } from "@/lib/authz";
import { formatInstantDate, formatWorkDate } from "@/lib/date";
import { listPendingReviews, type ReviewItem } from "@/lib/reviews";

import { ReviewActions } from "./review-actions";

export const metadata: Metadata = {
  title: "Reviews",
};

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <li className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start gap-3">
        <ProjectMark
          name={item.project.name}
          color={item.project.color}
          image={item.project.image}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/projects/${item.project.slug}`}
              className="text-sm font-medium [overflow-wrap:anywhere] hover:underline"
            >
              {item.project.name}
            </Link>
            <span className="font-mono text-[11px] text-muted-foreground">
              work date {formatWorkDate(item.workDate)}
            </span>
            {item.taskOrder ? (
              <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-[11px] text-info">
                {item.taskOrder.title}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm [overflow-wrap:anywhere]">{item.title}</p>

          {item.notes ? (
            <p className="mt-1 whitespace-pre-line text-xs [overflow-wrap:anywhere] text-muted-foreground">
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

        <div className="text-right">
          <p className="text-sm [overflow-wrap:anywhere]">{item.author.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            logged {formatInstantDate(item.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-border/70 pt-3">
        <ReviewActions submissionId={item.id} />
      </div>
    </li>
  );
}

export default async function ReviewsPage() {
  await requireAdmin();
  const items = await listPendingReviews();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Reviews"
        description="Submitted work waiting for a decision. Oldest first."
        back={{ href: "/admin", label: "Admin" }}
      />

      {items.length === 0 ? (
        <EmptyPanel
          icon={<CheckCircleIcon aria-hidden="true" className="size-5" />}
          title="Nothing to review"
          description="New submissions appear here as soon as a member adds them to a project."
          action={
            <Link
              href="/admin/projects"
              className="text-xs text-primary hover:underline"
            >
              Go to projects
            </Link>
          }
        />
      ) : (
        <section aria-label="Pending submissions" className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Pending
            </h2>
            <p className="font-mono text-[11px] text-muted-foreground">
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
