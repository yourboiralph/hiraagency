"use client";

import { useActionState } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";

import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";

import { updateAvatarAction, type AvatarState } from "./actions";

const initialState: AvatarState = {};

export function AvatarForm({ initialImage }: { initialImage: string | null }) {
  const [state, formAction, isPending] = useActionState(
    updateAvatarAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <ImageUploader
        kind="avatar"
        name="image"
        label="Your picture"
        initialKey={initialImage}
        maxBytes={2 * 1024 * 1024}
        shape="avatar"
        hint="JPEG, PNG or WebP up to 2 MB. Falls back to your initials."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <SpinnerGapIcon
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Saving…
            </>
          ) : (
            "Save picture"
          )}
        </Button>

        {state.ok ? (
          <p role="status" className="text-xs text-success">
            Saved.
          </p>
        ) : null}

        {state.formError ? (
          <p role="alert" className="text-sm text-destructive">
            {state.formError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
