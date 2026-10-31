import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretRightIcon,
  FolderOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

import { EmptyPanel } from "@/components/empty-panel";
import { PageHeader } from "@/components/page-header";
import { ProjectMark } from "@/components/project-mark";
import { ProjectStatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/authz";
import { fromDbDate, workDateLabel } from "@/lib/date";
import { listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjects(user);

  const active = projects.filter((project) => project.status === "ACTIVE");
  const archived = projects.filter((project) => project.status === "ARCHIVED");

  const roleLabel = (myRole: "LEAD" | "MEMBER" | null) => {
    if (user.role === "ADMIN") return "Administrator";
    return myRole === "LEAD" ? "You are lead" : "You are a member";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={
          user.role === "ADMIN"
            ? "Every project in the agency. Open one to see its feed."
            : "The projects you have been added to. Open one to see its feed."
        }
      />

      {active.length === 0 ? (
        <EmptyPanel
          icon={<FolderOpenIcon aria-hidden="true" className="size-5" />}
          title={
            user.role === "ADMIN"
              ? "No active projects"
              : "You are not on a project yet"
          }
          description={
            user.role === "ADMIN"
              ? "Create a project, then add the people working on it."
              : "Ask an administrator to add you to the projects you are working on."
          }
          action={
            user.role === "ADMIN" ? (
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Manage projects
                <CaretRightIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section aria-label="Active projects">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-start gap-3">
                    <ProjectMark
                      name={project.name}
                      color={project.color}
                      image={project.image}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {project.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {project.memberCount}{" "}
                        {project.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <CaretRightIcon
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </div>

                  <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">
                    {project.description ?? "No description yet."}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2.5 text-[11px] text-muted-foreground">
                    <span>{roleLabel(project.myRole)}</span>
                    <span>
                      {project.myLastWorkDate
                        ? `Last submitted ${workDateLabel(fromDbDate(project.myLastWorkDate))}`
                        : "No submissions yet"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {archived.length > 0 ? (
        <section aria-labelledby="archived-heading" className="space-y-2">
          <h2
            id="archived-heading"
            className="text-sm font-medium text-muted-foreground"
          >
            Archived
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {archived.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                >
                  <ProjectMark
                    name={project.name}
                    color={project.color}
                    image={project.image}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {project.name}
                  </span>
                  <ProjectStatusBadge status={project.status} />
                  <CaretRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
