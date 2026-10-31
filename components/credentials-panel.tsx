"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type Credentials = {
  name: string;
  email: string;
  tempPassword: string;
};

/**
 * Shown exactly once, right after an account is created or a password is
 * reset. Nothing here is ever stored in plain text, so if it is dismissed
 * unread the only recovery is another reset.
 */
export function CredentialsPanel({
  headline,
  note,
  credentials,
  onClose,
}: {
  headline: string;
  note: string;
  credentials: Credentials;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold">{headline}</DialogTitle>
        <DialogDescription>{note}</DialogDescription>
      </DialogHeader>

      <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Email
          </p>
          <p className="mt-0.5 font-mono text-sm break-all">
            {credentials.email}
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Temporary password
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-md bg-background px-2 py-1.5 font-mono text-sm break-all">
              {credentials.tempPassword}
            </code>
            <CopyButton value={credentials.tempPassword} />
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-warning">
        <WarningCircleIcon
          weight="fill"
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          Shown only now. The password is stored hashed, so it cannot be looked
          up later — reset it again if it gets lost.
        </span>
      </p>

      <div className="flex justify-end">
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
