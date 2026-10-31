"use client";

import { useState, useActionState } from "react";
import { KeyIcon } from "@phosphor-icons/react";

import { CredentialsPanel } from "@/components/credentials-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  // Derive openness instead of syncing it in an effect. Each reset produces a
  // new random password, so a fresh result reopens the dialog even if the
  // previous one was dismissed.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const tempPassword = state.credentials?.tempPassword ?? null;
  const open = tempPassword !== null && dismissed !== tempPassword;

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground"
        >
          <KeyIcon aria-hidden="true" className="size-4" />
          {isPending ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setDismissed(tempPassword);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {state.credentials ? (
            <CredentialsPanel
              headline="New temporary password"
              note={`${name} will be signed out of the current password and asked to choose a new one on their next sign in.`}
              credentials={state.credentials}
              onClose={() => setDismissed(tempPassword)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
