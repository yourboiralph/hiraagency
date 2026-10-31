"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";
import { cn } from "@/lib/utils";
import { PROJECT_COLORS } from "@/lib/validation/project";

export type ProjectFieldsState = {
  fieldErrors?: Record<string, string>;
};

export function ProjectFields({
  state,
  defaults,
}: {
  state: ProjectFieldsState;
  defaults?: {
    name?: string;
    description?: string | null;
    color?: string;
    image?: string | null;
  };
}) {
  const nameId = useId();
  const descriptionId = useId();
  const hintId = useId();
  const nameErrorId = useId();
  const descriptionErrorId = useId();

  const nameError = state.fieldErrors?.name;
  const descriptionError = state.fieldErrors?.description;
  const colorError = state.fieldErrors?.color;
  const selectedColor = defaults?.color ?? PROJECT_COLORS[0].value;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={nameId}>Project name</Label>
        <Input
          id={nameId}
          name="name"
          required
          maxLength={60}
          autoComplete="off"
          defaultValue={defaults?.name ?? ""}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? nameErrorId : undefined}
          placeholder="Brand refresh"
          className="h-10"
        />
        {nameError ? (
          <p id={nameErrorId} className="text-sm text-destructive">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={descriptionId}>
          Description{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id={descriptionId}
          name="description"
          rows={3}
          maxLength={280}
          defaultValue={defaults?.description ?? ""}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={descriptionError ? descriptionErrorId : hintId}
          placeholder="What this project covers, and for whom."
        />
        {descriptionError ? (
          <p id={descriptionErrorId} className="text-sm text-destructive">
            {descriptionError}
          </p>
        ) : (
          <p id={hintId} className="text-xs text-muted-foreground">
            One line. Shown on the project card and its page.
          </p>
        )}
      </div>

      <ImageUploader
        kind="project"
        name="image"
        label="Project picture"
        hint="Shown instead of the colored initial on cards and the project page. JPEG, PNG or WebP up to 5 MB."
        initialKey={defaults?.image ?? null}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Color</legend>
        <p className="text-xs text-muted-foreground">
          Used for the project marker, so it stays recognizable in lists.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {PROJECT_COLORS.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={option.value}
                defaultChecked={option.value === selectedColor}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                style={{ backgroundColor: option.value }}
                className={cn(
                  "block size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                  "peer-checked:ring-2 peer-checked:ring-foreground",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-foreground",
                  "peer-hover:ring-2 peer-hover:ring-foreground/30",
                )}
              />
              <span className="sr-only">{option.label}</span>
            </label>
          ))}
        </div>
        {colorError ? (
          <p className="text-sm text-destructive">{colorError}</p>
        ) : null}
      </fieldset>
    </>
  );
}
