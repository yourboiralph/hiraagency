"use client";

import Link from "next/link";
import { useId, useRef, useState, useActionState } from "react";
import {
  PlusIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { FormErrorSummary } from "@/components/form-error-summary";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SUBMISSION_LINKS } from "@/lib/submission-constants";

import { createSubmissionAction, type SubmissionFormState } from "../actions";

const initialState: SubmissionFormState = {};

type Row = { key: number; url: string; label: string };

export function SubmissionForm({
  projectId,
  projectSlug,
  today,
  minDate,
  maxBackdateDays,
}: {
  projectId: string;
  projectSlug: string;
  today: string;
  minDate: string;
  maxBackdateDays: number;
}) {
  const [state, formAction, isPending] = useActionState(
    createSubmissionAction,
    initialState,
  );

  const [rows, setRows] = useState<Row[]>([{ key: 1, url: "", label: "" }]);
  const nextKey = useRef(2);

  const prefix = useId();
  const fieldErrors = state.fieldErrors ?? {};

  function addRow() {
    setRows((current) => {
      if (current.length >= MAX_SUBMISSION_LINKS) return current;
      return [...current, { key: nextKey.current++, url: "", label: "" }];
    });
  }

  function removeRow(key: number) {
    setRows((current) =>
      current.length === 1
        ? current
        : current.filter((row) => row.key !== key),
    );
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />

      <FormErrorSummary
        message={state.formError}
        fieldErrors={state.fieldErrors}
      />

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-date`}>Work date</Label>
        <Input
          id={`${prefix}-date`}
          name="workDate"
          type="date"
          required
          min={minDate}
          max={today}
          defaultValue={today}
          aria-invalid={Boolean(fieldErrors.workDate)}
          aria-describedby={
            fieldErrors.workDate ? `${prefix}-date-error` : `${prefix}-date-hint`
          }
          className="h-10 w-full font-mono sm:w-52"
        />
        {fieldErrors.workDate ? (
          <p id={`${prefix}-date-error`} className="text-sm text-destructive">
            {fieldErrors.workDate}
          </p>
        ) : (
          <p id={`${prefix}-date-hint`} className="text-xs text-muted-foreground">
            Today or up to {maxBackdateDays} days back. Future dates are not
            allowed.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-title`}>What did you work on?</Label>
        <Input
          id={`${prefix}-title`}
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="Homepage hero and pricing section"
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={
            fieldErrors.title ? `${prefix}-title-error` : undefined
          }
          className="h-10"
        />
        {fieldErrors.title ? (
          <p id={`${prefix}-title-error`} className="text-sm text-destructive">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <legend className="text-sm font-medium">Links</legend>
          <span className="font-mono text-[11px] text-muted-foreground">
            {rows.length} of {MAX_SUBMISSION_LINKS}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste the files, videos or documents this work lives in. Labels are
          optional — the domain is shown when you skip one.
        </p>

        {fieldErrors.links ? (
          <p className="text-sm text-destructive">{fieldErrors.links}</p>
        ) : null}

        <div className="space-y-2">
          {rows.map((row, index) => {
            const urlError = fieldErrors[`url-${index}`];

            return (
              <div
                key={row.key}
                className="space-y-2 rounded-lg border border-border/70 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <Label
                        htmlFor={`${prefix}-url-${row.key}`}
                        className="sr-only"
                      >
                        Link {index + 1}
                      </Label>
                      <Input
                        id={`${prefix}-url-${row.key}`}
                        name="url"
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="https://…"
                        value={row.url}
                        onChange={(event) =>
                          updateRow(row.key, { url: event.target.value })
                        }
                        aria-invalid={Boolean(urlError)}
                        aria-describedby={
                          urlError ? `${prefix}-url-${row.key}-error` : undefined
                        }
                        className="h-9 font-mono text-xs"
                      />
                      {urlError ? (
                        <p
                          id={`${prefix}-url-${row.key}-error`}
                          className="mt-1 text-sm text-destructive"
                        >
                          {urlError}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <Label
                        htmlFor={`${prefix}-label-${row.key}`}
                        className="sr-only"
                      >
                        Label for link {index + 1}
                      </Label>
                      <Input
                        id={`${prefix}-label-${row.key}`}
                        name="label"
                        type="text"
                        autoComplete="off"
                        placeholder="Label (optional) — e.g. Homepage"
                        value={row.label}
                        onChange={(event) =>
                          updateRow(row.key, { label: event.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeRow(row.key)}
                      aria-label={`Remove link ${index + 1}`}
                      className="mt-1 text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon aria-hidden="true" className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_SUBMISSION_LINKS}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          Add another link
        </Button>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-notes`}>
          Notes{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id={`${prefix}-notes`}
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Context for the reviewer: what is finished, what needs a second look."
          aria-invalid={Boolean(fieldErrors.notes)}
          aria-describedby={
            fieldErrors.notes ? `${prefix}-notes-error` : undefined
          }
        />
        {fieldErrors.notes ? (
          <p id={`${prefix}-notes-error`} className="text-sm text-destructive">
            {fieldErrors.notes}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
        <p className="text-xs text-muted-foreground">
          Submitted work goes to an administrator for review.
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectSlug}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Cancel
          </Link>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <>
                <SpinnerGapIcon
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Submitting…
              </>
            ) : (
              "Submit work"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
