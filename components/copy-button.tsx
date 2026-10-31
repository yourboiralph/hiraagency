"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

/** Temporary passwords get read once and pasted somewhere — make that one click. */
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the value stays selectable on screen.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? (
        <CheckIcon aria-hidden="true" className="size-4 text-primary" />
      ) : (
        <CopyIcon aria-hidden="true" className="size-4" />
      )}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Button>
  );
}
