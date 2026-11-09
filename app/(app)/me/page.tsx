import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/authz";

import { AvatarForm } from "./avatar-form";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function MyActivityPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <PageHeader
        title="My profile"
        description="How you appear across the workspace."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[17px]">Profile picture</CardTitle>
            <CardDescription>
              Shown in the sidebar, member lists and next to your submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarForm initialImage={user.image} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[17px]">Account</CardTitle>
            <CardDescription>
              Managed by an administrator. Ask them if anything is wrong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-[15px]">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} image={user.image} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-3">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">
                {user.role === "ADMIN" ? "Administrator" : "Member"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-2xl border border-dashed border-border px-5 py-7 text-[15px] leading-relaxed text-muted-foreground">
        Your check-in and submission history will appear here in a later update.
      </p>
    </div>
  );
}
