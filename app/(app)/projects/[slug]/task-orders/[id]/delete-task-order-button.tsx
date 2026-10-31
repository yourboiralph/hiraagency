"use client";

import { useState, useActionState } from "react";
import { SpinnerGapIcon, TrashIcon } from "@phosphor-icons/react";

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

import { deleteTaskOrderAction, type TaskOrderState } from "../actions";

const initialState: TaskOrderState = {};

export function DeleteTaskOrderButton({
  taskOrderId,
  title,
  submissionCount,
}: {
  taskOrderId: string;
  title: string;
  submissionCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteTaskOrderAction,
    initialState,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <TrashIcon aria-hidden="true" className="size-4" />
        Delete
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this task order?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{title}</span>{" "}
            {submissionCount === 0
              ? "has no work attached."
              : submissionCount === 1
                ? "has 1 submission. It stays in the project feed but loses the task order link."
                : `has ${submissionCount} submissions. They stay in the project feed but lose the task order link.`}{" "}
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {state.formError ? (
          <p role="alert" className="text-sm text-destructive">
            {state.formError}
          </p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="taskOrderId" value={taskOrderId} />
          <DialogFooter className="-mx-4 -mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? (
                <SpinnerGapIcon
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <TrashIcon aria-hidden="true" className="size-4" />
              )}
              {isPending ? "Deleting…" : "Delete task order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
