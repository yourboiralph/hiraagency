"use client";

import { useEffect, useRef } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";

/**
 * Focusable error summary. Placed at the top of the form and focused after a
 * failed submit so keyboard and screen-reader users land on the problem
 * instead of hunting for red borders. Inline field errors stay in place.
 *
 * Pass `fieldErrors` when the form only reports per-field problems: the
 * summary then says so, instead of staying silent.
 */
export function FormErrorSummary({
  message,
  fieldErrors,
}: {
  message?: string;
  fieldErrors?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const count = fieldErrors ? Object.keys(fieldErrors).length : 0;
  const text =
    message ??
    (count > 0
      ? count === 1
        ? "One field needs attention. Check the message below."
        : "Some fields need attention. Check the messages below."
      : undefined);

  useEffect(() => {
    if (text) ref.current?.focus();
  }, [text]);

  if (!text) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <WarningCircleIcon
        weight="fill"
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-destructive"
      />
      <p className="leading-snug">{text}</p>
    </div>
  );
}
