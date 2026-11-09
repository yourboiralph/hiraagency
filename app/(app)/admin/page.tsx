import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretRightIcon,
  ClipboardTextIcon,
  FolderOpenIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayRoster, type Attendee } from "@/lib/attendance";
import { requireAdmin } from "@/lib/authz";
import {
  formatDuration,
  formatInstantDate,
  formatTime,
  formatWorkDate,
  workDateToday,
} from "@/lib/date";
import { db } from "@/lib/db";
import { getPendingReviewSummary } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Admin",
};

function SectionLink({
  href,
  icon,
  title,
  description,
  meta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="card-lift group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
        <span className="mt-2 block font-mono text-xs text-muted-foreground">
          {meta}
        </span>
      </span>
      <CaretRightIcon
        aria-hidden="true"
        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function AttendeeLine({ person }: { person: Attendee }) {
  const attendance = person.attendance;

  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${
          attendance ? "bg-success" : "bg-warning"
        }`}
      />
      <span className="min-w-0 flex-1 truncate text-[15px]">{person.name}</span>
      {attendance?.checkOutAt ? (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {formatDuration(attendance.checkInAt, attendance.checkOutAt)}
        </span>
      ) : null}
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {attendance === null
          ? "—"
          : attendance.checkOutAt
            ? `${formatTime(attendance.checkInAt)} – ${formatTime(attendance.checkOutAt)}`
            : `since ${formatTime(attendance.checkInAt)}`}
      </span>
    </li>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const today = workDateToday();

  const [projectCount, activeProjectCount, peopleCount, roster, reviewSummary] =
    await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.user.count(),
      getTodayRoster(today),
      getPendingReviewSummary(),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description="Today's attendance, plus the projects and accounts behind them."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-[17px]">Today&apos;s attendance</CardTitle>
          <CardDescription>
            {formatWorkDate(today, "long")} ·{" "}
            <span className="font-mono text-foreground">
              {roster.checkedIn} of {roster.total}
            </span>{" "}
            checked in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-[13px] font-medium text-muted-foreground">
              Not checked in · {roster.absent.length}
            </h3>
            {roster.absent.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Everyone has checked in.
              </p>
            ) : (
              <ul className="mt-1">
                {roster.absent.map((person) => (
                  <AttendeeLine key={person.id} person={person} />
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-muted-foreground">
              Checked in · {roster.checkedIn}
            </h3>
            {roster.present.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Nobody has checked in yet today.
              </p>
            ) : (
              <ul className="mt-1">
                {roster.present.map((person) => (
                  <AttendeeLine key={person.id} person={person} />
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <section
        aria-label="Manage"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <SectionLink
          href="/admin/projects"
          icon={<FolderOpenIcon aria-hidden="true" className="size-5" />}
          title="Projects"
          description="Create projects, change their details, and decide who works on them."
          meta={`${activeProjectCount} active · ${projectCount} total`}
        />
        <SectionLink
          href="/admin/users"
          icon={<UsersIcon aria-hidden="true" className="size-5" />}
          title="People"
          description="Create accounts, hand out temporary passwords, and deactivate access."
          meta={`${roster.total} active · ${peopleCount} total`}
        />
        <SectionLink
          href="/reviews"
          icon={<ClipboardTextIcon aria-hidden="true" className="size-5" />}
          title="Reviews"
          description="Approve submitted work or send it back with a note."
          meta={
            reviewSummary.count === 0 || !reviewSummary.oldestAt
              ? "Nothing waiting"
              : `${reviewSummary.count} pending · oldest ${formatInstantDate(
                  reviewSummary.oldestAt,
                )}`
          }
        />
      </section>
    </div>
  );
}
