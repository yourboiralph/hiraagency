"use client";

import { useActionState, useId } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";

import { FormErrorSummary } from "@/components/form-error-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextPath ?? ""} />

      <FormErrorSummary message={state.formError} />

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          required
          defaultValue={state.values?.email ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? emailErrorId : undefined
          }
          className="h-11 font-mono text-sm"
          placeholder="you@hiraagency.com"
        />
        {state.fieldErrors?.email ? (
          <p id={emailErrorId} className="text-sm text-destructive">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? passwordErrorId : undefined
          }
          className="h-11"
        />
        {state.fieldErrors?.password ? (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full font-medium"
      >
        {isPending ? (
          <>
            <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Accounts are created by an administrator. There is no self sign-up.
      </p>
    </form>
  );
}
