import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { getSessionUser } from "@/lib/authz";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; changed?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect("/dashboard");

  const { next, changed } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--primary),transparent_70%)] opacity-[0.08]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-primary font-mono text-sm font-semibold text-primary-foreground"
          >
            H
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">HiraAgency</p>
            <p className="mt-1 text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Use the account your administrator created for you.
        </p>

        {changed ? (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
          >
            <CheckCircleIcon
              weight="fill"
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-success"
            />
            <p className="leading-snug">
              Password updated. Sign in with your new password.
            </p>
          </div>
        ) : null}

        <LoginForm nextPath={next} />
      </div>
    </main>
  );
}
