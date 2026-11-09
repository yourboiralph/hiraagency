import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { requireUser } from "@/lib/authz";

import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set your password",
};

export default async function SetPasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  // Already changed it — nothing to do here.
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <AuthShell
      title="Set your password"
      description={
        <>
          You are signed in as{" "}
          <span className="font-mono text-sm text-foreground">
            {user.email}
          </span>
          . Replace the temporary password before continuing.
        </>
      }
      footnote="Choose a password you have not used elsewhere. You will sign in again afterwards."
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
