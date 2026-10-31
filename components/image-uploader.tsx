"use client";

import { useId, useRef, useState } from "react";
import {
  ImageSquareIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { createUploadTargetAction } from "@/app/(app)/media-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads immediately (presigned PUT, straight to the bucket) and carries the
 * resulting object key in a hidden input, so the surrounding form saves only a
 * key and never a file body.
 */
export function ImageUploader({
  kind,
  name = "image",
  initialKey = null,
  label,
  hint,
  maxBytes = 5 * 1024 * 1024,
  shape = "square",
}: {
  kind: "avatar" | "project";
  name?: string;
  initialKey?: string | null;
  label: string;
  hint?: string;
  maxBytes?: number;
  shape?: "avatar" | "square";
}) {
  const [key, setKey] = useState<string | null>(initialKey);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }

    if (file.size > maxBytes) {
      setError(
        `Keep the image under ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      );
      return;
    }

    setUploading(true);

    try {
      const target = await createUploadTargetAction({
        kind,
        contentType: file.type,
        size: file.size,
      });

      if (!target.ok) {
        setError(target.error);
        return;
      }

      const response = await fetch(target.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("upload failed");

      setKey(target.key);
    } catch {
      setError("The upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const preview = key ? `/api/media/${key}` : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden bg-muted text-muted-foreground",
            shape === "avatar" ? "size-16 rounded-full" : "size-20 rounded-lg",
            preview ? null : "border border-dashed border-border",
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ImageSquareIcon aria-hidden="true" className="size-6" />
          )}

          {uploading ? (
            <span className="absolute inset-0 grid place-items-center bg-background/70">
              <SpinnerGapIcon
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Uploading…" : preview ? "Replace" : "Upload image"}
            </Button>

            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => setKey(null)}
                className="text-muted-foreground"
              >
                <TrashIcon aria-hidden="true" className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>

          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input type="hidden" name={name} value={key ?? ""} />
    </div>
  );
}
