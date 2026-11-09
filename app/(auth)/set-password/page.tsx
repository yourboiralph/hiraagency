import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr";

import { HiraLogo } from "@/components/hira-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/authz";

import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function SetPasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  // Already changed it — nothing to do here.
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#010736] px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_38%,rgba(34,57,111,0.75),transparent_66%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#010736] to-transparent" />
      </div>

      <p className="absolute left-4 top-4 z-20 text-[13px] font-medium text-white/80 sm:left-6 sm:top-6">
        Hira Agency
      </p>
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
      </div>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <HiraLogo size={48} />
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[12px] font-medium text-warning">
            Required step
          </span>
        </div>

        <div className="mt-7 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
            <LockKeyIcon aria-hidden="true" weight="fill" className="size-5" />
          </span>
          <div>
            <h1
              id="set-password-title"
              className="text-2xl font-medium tracking-[-0.02em]"
            >
              Set a new password
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You are signed in with a temporary password. Choose a new one to
              finish setting up your account.
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email}</span>
        </p>

        <div className="mt-6">
          <SetPasswordForm />
        </div>
      </section>
    </main>
  );
}
