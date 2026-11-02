"use client";

import { useId, useState, useActionState } from "react";
import {
  CheckIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  approveSubmissionAction,
  rejectSubmissionAction,
  requestRevisionAction,
  type ReviewState,
} from "./actions";

const initialState: ReviewState = {};

type Asking = "revision" | "reject" | null;

export function ReviewActions({
  submissionId,
  hasTaskOrder,
}: {
  submissionId: string;
  hasTaskOrder: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveSubmissionAction,
    initialState,
  );
  const [revisionState, revisionAction, revisionPending] = useActionState(
    requestRevisionAction,
    initialState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectSubmissionAction,
    initialState,
  );

  const [asking, setAsking] = useState<Asking>(null);

  const revisionNoteId = useId();
  const rejectNoteId = useId();

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

        {asking === null ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAsking("revision")}
            >
              <PencilSimpleIcon aria-hidden="true" className="size-4" />
              Request revision
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAsking("reject")}
              className="text-destructive hover:text-destructive"
            >
              <ProhibitIcon aria-hidden="true" className="size-4" />
              Reject
            </Button>
          </>
        ) : null}

        {approveState.formError ? (
          <p role="alert" className="text-sm text-destructive">
            {approveState.formError}
          </p>
        ) : null}
      </div>

      {asking === "revision" ? (
        <form
          action={revisionAction}
          className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <input type="hidden" name="submissionId" value={submissionId} />

          <Label htmlFor={revisionNoteId}>What needs to change?</Label>
          <Textarea
            id={revisionNoteId}
            name="note"
            rows={2}
            maxLength={500}
            required
            autoFocus
            placeholder="The pricing section still needs the annual toggle before this is done."
            aria-invalid={Boolean(revisionState.fieldErrors?.note)}
            aria-describedby={
              revisionState.fieldErrors?.note
                ? `${revisionNoteId}-error`
                : undefined
            }
          />
          {revisionState.fieldErrors?.note ? (
            <p
              id={`${revisionNoteId}-error`}
              className="text-sm text-destructive"
            >
              {revisionState.fieldErrors.note}
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
              onClick={() => setAsking(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={revisionPending}>
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

      {asking === "reject" ? (
        <form
          action={rejectAction}
          className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
        >
          <input type="hidden" name="submissionId" value={submissionId} />

          <Label htmlFor={rejectNoteId}>Why is this rejected?</Label>
          <Textarea
            id={rejectNoteId}
            name="note"
            rows={2}
            maxLength={500}
            required
            autoFocus
            placeholder="This is not the brief we agreed on, and it will not be taken further."
            aria-invalid={Boolean(rejectState.fieldErrors?.note)}
            aria-describedby={
              rejectState.fieldErrors?.note
                ? `${rejectNoteId}-error`
                : undefined
            }
          />
          {rejectState.fieldErrors?.note ? (
            <p
              id={`${rejectNoteId}-error`}
              className="text-sm text-destructive"
            >
              {rejectState.fieldErrors.note}
            </p>
          ) : null}

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <WarningCircleIcon
              weight="fill"
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <span>
              Rejection is final.
              {hasTaskOrder
                ? " This member will not be able to submit more work to this task order."
                : ""}
            </span>
          </p>

          {rejectState.formError ? (
            <p role="alert" className="text-sm text-destructive">
              {rejectState.formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAsking(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={rejectPending}
            >
              {rejectPending ? (
                <SpinnerGapIcon
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <ProhibitIcon aria-hidden="true" className="size-4" />
              )}
              {rejectPending ? "Rejecting…" : "Reject work"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
