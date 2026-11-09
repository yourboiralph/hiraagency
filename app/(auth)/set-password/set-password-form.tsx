"use client";

import { useActionState, useId } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";

import { FormErrorSummary } from "@/components/form-error-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { setPasswordAction, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = {};

export function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    setPasswordAction,
    initialState,
  );

  const passwordId = useId();
  const confirmId = useId();
  const hintId = useId();
  const passwordErrorId = useId();
  const confirmErrorId = useId();

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormErrorSummary message={state.formError} />

      <div className="space-y-2">
        <Label htmlFor={passwordId}>New password</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password
              ? `${hintId} ${passwordErrorId}`
              : hintId
          }
          className="h-11"
        />
        <p id={hintId} className="text-xs text-muted-foreground">
          At least 12 characters. A passphrase of a few unrelated words works
          well and is easier to remember.
        </p>
        {state.fieldErrors?.password ? (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmId}>Confirm new password</Label>
        <Input
          id={confirmId}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirm)}
          aria-describedby={
            state.fieldErrors?.confirm ? confirmErrorId : undefined
          }
          className="h-11"
        />
        {state.fieldErrors?.confirm ? (
          <p id={confirmErrorId} className="text-sm text-destructive">
            {state.fieldErrors.confirm}
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
            Saving…
          </>
        ) : (
          "Save password and sign in again"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You will be signed out and asked to sign in with the new password.
      </p>
    </form>
  );
}
