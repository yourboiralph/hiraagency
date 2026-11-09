"use client";

import { useId, useRef, useState } from "react";
import {
  ImageSquareIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { createUploadTargetAction } from "@/app/(app)/media-actions";
import { Button } from "@/components/ui/button";
import { MAX_SUBMISSION_IMAGES } from "@/lib/submission-constants";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Pictures for one submission: upload as you go, remove before submitting. */
export function SubmissionImagePicker() {
  const [keys, setKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleFiles(files: FileList) {
    setError(null);

    const room = MAX_SUBMISSION_IMAGES - keys.length;
    const chosen = Array.from(files).slice(0, room);

    if (chosen.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of chosen) {
        if (!ACCEPTED.includes(file.type)) {
          setError("Use JPEG, PNG or WebP images.");
          continue;
        }

        if (file.size > MAX_BYTES) {
          setError("Each image must be 5 MB or smaller.");
          continue;
        }

        const target = await createUploadTargetAction({
          kind: "submission",
          contentType: file.type,
          size: file.size,
        });

        if (!target.ok) {
          setError(target.error);
          break;
        }

        const response = await fetch(target.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!response.ok) {
          setError("An upload failed. Try again.");
          break;
        }

        uploaded.push(target.key);
      }
    } finally {
      if (uploaded.length > 0) {
        setKeys((current) => [...current, ...uploaded]);
      }
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">
          Pictures{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {keys.length} of {MAX_SUBMISSION_IMAGES}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Screenshots or exports, up to {MAX_SUBMISSION_IMAGES} per submission and
        5 MB each. Only signed-in members of the agency can open them.
      </p>

      {keys.length > 0 ? (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {keys.map((key) => (
            <li key={key} className="relative">
              <a
                href={`/api/media/${key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-md border border-border/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${key}`}
                  alt=""
                  className="size-full object-cover"
                />
              </a>
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label="Remove picture"
                className="absolute top-1 right-1"
                onClick={() =>
                  setKeys((current) => current.filter((item) => item !== key))
                }
              >
                <TrashIcon aria-hidden="true" className="size-3" />
              </Button>
              <input type="hidden" name="imageKey" value={key} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || keys.length >= MAX_SUBMISSION_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <SpinnerGapIcon
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : (
            <ImageSquareIcon aria-hidden="true" className="size-4" />
          )}
          {uploading ? "Uploading…" : "Add pictures"}
        </Button>

        {keys.length >= MAX_SUBMISSION_IMAGES ? (
          <span className="text-xs text-muted-foreground">
            Maximum reached.
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label htmlFor={inputId} className="sr-only">
        Add pictures
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) void handleFiles(event.target.files);
        }}
      />
    </div>
  );
}
