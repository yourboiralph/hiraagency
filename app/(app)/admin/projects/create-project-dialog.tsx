"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import {
  CheckCircleIcon,
  PlusIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

import { FormErrorSummary } from "@/components/form-error-summary";
import { ProjectFields } from "@/components/project-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createProjectAction, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = {};

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden="true" className="size-4" />
        New project
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <CreateProjectFlow onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectFlow({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState,
  );

  // The created project is a real step, not a toast: adding members right
  // after creating is the common next move.
  if (state.ok && state.project) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircleIcon
              weight="fill"
              aria-hidden="true"
              className="size-5 text-primary"
            />
            Project created
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {state.project.name}
            </span>{" "}
            is ready. Add the people who work on it, or close this and do it
            later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
          <Link
            href={`/admin/projects/${state.project.id}`}
            onClick={onClose}
            className={buttonVariants()}
          >
            Add members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <DialogHeader>
        <DialogTitle>New project</DialogTitle>
        <DialogDescription>
          Projects group the daily work of the people on them. You can add
          members right after creating it.
        </DialogDescription>
      </DialogHeader>

      <FormErrorSummary
        message={state.formError}
        fieldErrors={state.fieldErrors}
      />
      <ProjectFields state={state} />

      <DialogFooter className="-mx-4 -mb-4 mt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create project"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
