import type { Metadata } from "next";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyPanel } from "@/components/empty-panel";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/authz";
import { formatInstantDate } from "@/lib/date";
import { listUsers } from "@/lib/users";

import { AddUserDialog } from "./add-user-dialog";
import { UserRowActions } from "./user-row-actions";

export const metadata: Metadata = {
  title: "People",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await listUsers();

  const activeCount = users.filter((user) => user.isActive).length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="People"
        description="Accounts are created here. Nobody can sign up on their own."
        back={{ href: "/admin", label: "Admin" }}
        actions={<AddUserDialog />}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          All accounts
        </h2>
        <p className="font-mono text-[11px] text-muted-foreground">
          {activeCount} active · {adminCount}{" "}
          {adminCount === 1 ? "administrator" : "administrators"} ·{" "}
          {users.length} total
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyPanel
          icon={<UsersIcon aria-hidden="true" className="size-5" />}
          title="No accounts yet"
          description="Add the first person. They will receive a temporary password and choose their own on first sign in."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-medium"
              >
                {initials(user.name)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <RoleBadge role={user.role} />
                  {user.isActive ? null : (
                    <Badge variant="outline" className="text-destructive">
                      Inactive
                    </Badge>
                  )}
                  {user.mustChangePassword ? (
                    <Badge variant="outline" className="text-warning">
                      Temp password
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-mono text-xs">
                  {user.projectCount}{" "}
                  {user.projectCount === 1 ? "project" : "projects"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Added {formatInstantDate(user.createdAt)}
                </p>
              </div>

              <UserRowActions
                user={{
                  id: user.id,
                  name: user.name,
                  isActive: user.isActive,
                  isSelf: user.id === admin.id,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
