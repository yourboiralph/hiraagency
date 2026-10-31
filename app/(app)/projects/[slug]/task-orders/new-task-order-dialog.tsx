"use client";

import { useId, useState, useActionState } from "react";
import { PlusIcon, SpinnerGapIcon } from "@phosphor-icons/react";

import { FormErrorSummary } from "@/components/form-error-summary";
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
import { Textarea } from "@/components/ui/textarea";

import { createTaskOrderAction, type TaskOrderState } from "./actions";

const initialState: TaskOrderState = {};

export function NewTaskOrderDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PlusIcon aria-hidden="true" className="size-4" />
        New task order
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <NewTaskOrderForm projectId={projectId} />
      </DialogContent>
    </Dialog>
  );
}

function NewTaskOrderForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(
    createTaskOrderAction,
    initialState,
  );

  const titleId = useId();
  const briefId = useId();

  return (
    <form action={formAction} className="space-y-4">
      <DialogHeader>
        <DialogTitle>New task order</DialogTitle>
        <DialogDescription>
          A brief the team can attach their work to. Members respond to it;
          leads and administrators can close it when it is done.
        </DialogDescription>
      </DialogHeader>

      <input type="hidden" name="projectId" value={projectId} />

      <FormErrorSummary
        message={state.formError}
        fieldErrors={state.fieldErrors}
      />

      <div className="space-y-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input
          id={titleId}
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          autoFocus
          placeholder="Build the spawn hub"
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby={
            state.fieldErrors?.title ? `${titleId}-error` : undefined
          }
          className="h-10"
        />
        {state.fieldErrors?.title ? (
          <p id={`${titleId}-error`} className="text-sm text-destructive">
            {state.fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={briefId}>
          Brief{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id={briefId}
          name="brief"
          rows={4}
          maxLength={2000}
          placeholder="What needs doing, the style, the constraints, and what counts as done."
          aria-invalid={Boolean(state.fieldErrors?.brief)}
          aria-describedby={
            state.fieldErrors?.brief ? `${briefId}-error` : undefined
          }
        />
        {state.fieldErrors?.brief ? (
          <p id={`${briefId}-error`} className="text-sm text-destructive">
            {state.fieldErrors.brief}
          </p>
        ) : null}
      </div>

      <DialogFooter className="-mx-4 -mb-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <SpinnerGapIcon
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Creating…
            </>
          ) : (
            "Create task order"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
