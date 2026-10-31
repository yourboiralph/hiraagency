import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          First sign in
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Set your password
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          You are signed in as{" "}
          <span className="font-mono text-xs text-foreground">
            {user.email}
          </span>
          . Replace the temporary password before continuing.
        </p>

        <SetPasswordForm />
      </div>
    </main>
  );
}
