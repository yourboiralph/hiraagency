import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell
      title="Sign in"
      description="Use the account your administrator created for you."
    >
      {changed ? (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-success/40 bg-success/10 p-3 text-sm"
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
    </AuthShell>
  );
}
