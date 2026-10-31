"use client";

import { useEffect, useActionState } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { FormErrorSummary } from "@/components/form-error-summary";
import { ProjectFields } from "@/components/project-fields";
import { Button } from "@/components/ui/button";

import { updateProjectAction, type ProjectFormState } from "../actions";

const initialState: ProjectFormState = {};

export function ProjectDetailsForm({
  project,
}: {
  project: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    image: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(
    updateProjectAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success("Project details saved.");
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={project.id} />

      <FormErrorSummary
        message={state.formError}
        fieldErrors={state.fieldErrors}
      />
      <ProjectFields state={state} defaults={project} />

      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <p className="text-xs text-muted-foreground">
          Renaming leaves the project URL unchanged.
        </p>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
