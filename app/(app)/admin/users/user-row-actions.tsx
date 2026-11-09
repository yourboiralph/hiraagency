"use client";

import { Button } from "@/components/ui/button";

import { setUserActiveAction } from "./actions";
import { ResetPasswordButton } from "./reset-password-button";

export function UserRowActions({
  user,
}: {
  user: { id: string; name: string; isActive: boolean; isSelf: boolean };
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <ResetPasswordButton userId={user.id} name={user.name} />

      {user.isSelf ? (
        <span className="px-2 font-mono text-xs text-muted-foreground">
          You
        </span>
      ) : (
        <form action={setUserActiveAction}>
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="hidden"
            name="isActive"
            value={user.isActive ? "false" : "true"}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className={
              user.isActive
                ? "text-muted-foreground hover:text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {user.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </form>
      )}
    </div>
  );
}
