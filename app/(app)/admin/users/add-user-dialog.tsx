"use client";

import { useEffect, useId, useState, useActionState } from "react";
import { SpinnerGapIcon, UserPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { CredentialsPanel } from "@/components/credentials-panel";
import { FormErrorSummary } from "@/components/form-error-summary";
import { FormSelect } from "@/components/form-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createUserAction, type AddUserState } from "./actions";

const initialState: AddUserState = {};

export function AddUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlusIcon aria-hidden="true" className="size-4" />
        Add person
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <AddUserFlow onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddUserFlow({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState,
  );

  const nameId = useId();
  const emailId = useId();
  const roleId = useId();

  useEffect(() => {
    if (state.ok) toast.success("Account created.");
  }, [state.ok]);

  if (state.credentials) {
    return (
      <CredentialsPanel
        headline="Account created"
        note="Hand these over to the person. They will choose their own password the first time they sign in."
        credentials={state.credentials}
        onClose={onClose}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add person</DialogTitle>
        <DialogDescription>
          There is no self sign-up. You create the account and pass on a
          temporary password.
        </DialogDescription>
      </DialogHeader>

      <FormErrorSummary message={state.formError} />

      <div className="space-y-2">
        <Label htmlFor={nameId}>Full name</Label>
        <Input
          id={nameId}
          name="name"
          required
          autoComplete="off"
          defaultValue=""
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? `${nameId}-error` : undefined
          }
          placeholder="Maria Santos"
          className="h-10"
        />
        {state.fieldErrors?.name ? (
          <p id={`${nameId}-error`} className="text-sm text-destructive">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? `${emailId}-error` : undefined
          }
          placeholder="maria@hiraagency.com"
          className="h-10 font-mono text-sm"
        />
        {state.fieldErrors?.email ? (
          <p id={`${emailId}-error`} className="text-sm text-destructive">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={roleId}>Role</Label>
        <FormSelect id={roleId} name="role" defaultValue="MEMBER">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Administrator</option>
        </FormSelect>
        <p className="text-xs text-muted-foreground">
          Administrators manage projects, people and reviews.
        </p>
      </div>

      <DialogFooter className="-mx-4 -mb-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
