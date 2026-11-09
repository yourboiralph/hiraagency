import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/page-header";
import { ProjectStatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/authz";
import { formatInstantDate } from "@/lib/date";
import { getAdminProject } from "@/lib/projects";

import { MembersPanel } from "./members-panel";
import { ProjectDetailsForm } from "./project-details-form";
import { ProjectStatusCard } from "./status-card";

export const metadata = { title: "Project" };

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { project, members, assignable } = await getAdminProject(id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project"
        title={project.name}
        description={project.description ?? undefined}
        back={{ href: "/admin/projects", label: "Projects" }}
        actions={
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowSquareOutIcon aria-hidden="true" className="size-4" />
            Member view
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <ProjectStatusBadge status={project.status} />
        <span className="font-mono">/{project.slug}</span>
        <span>
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
        <span>{project._count.submissions} submissions</span>
        <span>Created {formatInstantDate(project.createdAt)}</span>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[17px]">Details</CardTitle>
            <CardDescription>
              How the project appears on cards and its page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectDetailsForm project={project} />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-[17px]">Members</CardTitle>
              <CardDescription>
                People added here can submit work for this project. Leads are
                marked, but review is still done by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembersPanel
                projectId={project.id}
                members={members}
                assignable={assignable}
              />
            </CardContent>
          </Card>

          <ProjectStatusCard projectId={project.id} status={project.status} />
        </div>
      </div>
    </div>
  );
}
