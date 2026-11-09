"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircleIcon,
  ClockIcon,
  SignInIcon,
  SignOutIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  checkInAction,
  checkOutAction,
  type AttendanceState,
} from "./actions";

const initialState: AttendanceState = {};

type Status = "idle" | "working" | "done";

export function CheckInCard({
  checkedInAt,
  checkedOutAt,
  duration,
  todayLabel,
}: {
  checkedInAt: string | null;
  checkedOutAt: string | null;
  duration: string | null;
  todayLabel: string;
}) {
  const [checkInState, checkInFormAction] = useActionState(
    checkInAction,
    initialState,
  );
  const [checkOutState, checkOutFormAction] = useActionState(
    checkOutAction,
    initialState,
  );

  const status: Status = checkedOutAt
    ? "done"
    : checkedInAt
      ? "working"
      : "idle";

  const error = checkInState.error ?? checkOutState.error;

  const title =
    status === "done"
      ? `Checked out at ${checkedOutAt}`
      : status === "working"
        ? `Checked in at ${checkedInAt}`
        : "You haven't checked in today";

  const detail =
    status === "done"
      ? `Checked in at ${checkedInAt} · ${duration} worked. That's your day finished.`
      : status === "working"
        ? "Working now. Check out when you finish for the day."
        : `Recorded against ${todayLabel}. One check-in per day.`;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden border-l-4 py-5",
        status === "idle" && "border-l-warning bg-warning/5",
        status === "working" && "border-l-success bg-success/5",
      )}
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-5 px-5">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              status === "idle" && "bg-warning/10 text-warning",
              status === "working" && "bg-success/10 text-success",
              status === "done" && "bg-muted text-muted-foreground",
            )}
          >
            {status === "idle" ? (
              <WarningCircleIcon weight="fill" className="size-5" />
            ) : status === "working" ? (
              <CheckCircleIcon weight="fill" className="size-5" />
            ) : (
              <ClockIcon weight="fill" className="size-5" />
            )}
          </span>

          <div aria-live="polite">
            <p className="text-base font-medium">{title}</p>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {detail}
            </p>
            {error ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        {status === "done" ? null : (
          <form
            action={status === "idle" ? checkInFormAction : checkOutFormAction}
          >
            <SubmitButton checkingOut={status === "working"} />
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitButton({ checkingOut }: { checkingOut: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="default"
      variant={checkingOut ? "outline" : "default"}
      disabled={pending}
      className="h-10 px-4"
    >
      {pending ? (
        <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
      ) : checkingOut ? (
        <SignOutIcon aria-hidden="true" className="size-4" />
      ) : (
        <SignInIcon aria-hidden="true" className="size-4" />
      )}
      {pending
        ? checkingOut
          ? "Checking out…"
          : "Checking in…"
        : checkingOut
          ? "Check out"
          : "Check in"}
    </Button>
  );
}
