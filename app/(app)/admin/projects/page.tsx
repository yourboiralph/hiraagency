import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretRightIcon,
  FolderOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import { EmptyPanel } from "@/components/empty-panel";
import { ProjectMark } from "@/components/project-mark";
import { ProjectStatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/authz";
import { listAdminProjects } from "@/lib/projects";

import { CreateProjectDialog } from "./create-project-dialog";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await listAdminProjects();
  const activeCount = projects.filter(
    (project) => project.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Projects"
        description="Every project in the agency. Open one to change its details or manage who works on it."
        back={{ href: "/admin", label: "Admin" }}
        actions={<CreateProjectDialog />}
      />

      {projects.length === 0 ? (
        <EmptyPanel
          icon={<FolderOpenIcon aria-hidden="true" className="size-5" />}
          title="No projects yet"
          description="Create the first project, then add the people working on it. Members only see the projects they belong to."
        />
      ) : (
        <section aria-labelledby="project-list-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="project-list-heading"
              className="text-[13px] font-medium text-muted-foreground"
            >
              All projects
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {activeCount} active · {projects.length} total
            </p>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                >
                  <ProjectMark
                    name={project.name}
                    color={project.color}
                    image={project.image}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-medium">
                        {project.name}
                      </span>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      /{project.slug}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="font-mono text-xs">
                      {project.memberCount}{" "}
                      {project.memberCount === 1 ? "member" : "members"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.submissionCount} submissions
                    </p>
                  </div>

                  <CaretRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
