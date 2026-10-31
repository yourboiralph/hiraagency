"use client";

import { useId, useState, useActionState } from "react";
import {
  CheckIcon,
  PencilSimpleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  approveSubmissionAction,
  requestRevisionAction,
  type ReviewState,
} from "./actions";

const initialState: ReviewState = {};

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveSubmissionAction,
    initialState,
  );
  const [revisionState, revisionAction, revisionPending] = useActionState(
    requestRevisionAction,
    initialState,
  );

  const [askingWhy, setAskingWhy] = useState(false);
  const noteId = useId();

  const noteError = revisionState.fieldErrors?.note;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approveAction}>
          <input type="hidden" name="submissionId" value={submissionId} />
          <Button type="submit" size="sm" disabled={approvePending}>
            {approvePending ? (
              <SpinnerGapIcon
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <CheckIcon aria-hidden="true" className="size-4" />
            )}
            {approvePending ? "Approving…" : "Approve"}
          </Button>
        </form>

        {askingWhy ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAskingWhy(true)}
          >
            <PencilSimpleIcon aria-hidden="true" className="size-4" />
            Request revision
          </Button>
        )}

        {approveState.formError ? (
          <p role="alert" className="text-sm text-destructive">
            {approveState.formError}
          </p>
        ) : null}
      </div>

      {askingWhy ? (
        <form
          action={revisionAction}
          className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
        >
          <input type="hidden" name="submissionId" value={submissionId} />

          <Label htmlFor={noteId}>What needs to change?</Label>
          <Textarea
            id={noteId}
            name="note"
            rows={2}
            maxLength={500}
            required
            autoFocus
            placeholder="The pricing section still needs the annual toggle before this is done."
            aria-invalid={Boolean(noteError)}
            aria-describedby={noteError ? `${noteId}-error` : undefined}
          />
          {noteError ? (
            <p id={`${noteId}-error`} className="text-sm text-destructive">
              {noteError}
            </p>
          ) : null}

          {revisionState.formError ? (
            <p role="alert" className="text-sm text-destructive">
              {revisionState.formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAskingWhy(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={revisionPending}
            >
              {revisionPending ? (
                <SpinnerGapIcon
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              {revisionPending ? "Sending…" : "Send back"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
