"use client";

import { useEffect, useId, useActionState } from "react";
import { SpinnerGapIcon, TrashIcon, UserPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { FormErrorSummary } from "@/components/form-error-summary";
import { FormSelect } from "@/components/form-select";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  addMemberAction,
  removeMemberAction,
  setMemberRoleAction,
  type MemberFormState,
} from "../actions";

type Member = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "LEAD" | "MEMBER";
  isActive: boolean;
};

const initialState: MemberFormState = {};

export function MembersPanel({
  projectId,
  members,
  assignable,
}: {
  projectId: string;
  members: Member[];
  assignable: { id: string; name: string; email: string }[];
}) {
  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-5 text-[15px] leading-relaxed text-muted-foreground">
          No one is on this project yet. Add the first person below.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 first:pt-0 last:pb-0"
            >
              <UserAvatar
                name={member.name}
                image={member.image}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-medium">
                    {member.name}
                  </p>
                  {member.role === "LEAD" ? (
                    <Badge
                      variant="outline"
                      className="border-info/30 bg-info/10 text-info"
                    >
                      Lead
                    </Badge>
                  ) : null}
                  {member.isActive ? null : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>

              <form action={setMemberRoleAction} className="flex items-center">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="userId" value={member.userId} />
                <FormSelect
                  name="role"
                  defaultValue={member.role}
                  aria-label={`Project role for ${member.name}`}
                  className="h-9 w-28 text-sm"
                  onChange={(event) => event.currentTarget.form?.requestSubmit()}
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Lead</option>
                </FormSelect>
              </form>

              <form action={removeMemberAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="userId" value={member.userId} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${member.name} from this project`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon aria-hidden="true" className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {assignable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Everyone with an active account is already on this project.
        </p>
      ) : (
        <AddMemberForm projectId={projectId} assignable={assignable} />
      )}
    </div>
  );
}

function AddMemberForm({
  projectId,
  assignable,
}: {
  projectId: string;
  assignable: { id: string; name: string; email: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    addMemberAction,
    initialState,
  );

  const personId = useId();
  const roleId = useId();

  useEffect(() => {
    if (state.ok) toast.success("Member added.");
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-border/70 p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <FormErrorSummary message={state.formError} />

      <div className="grid gap-3 sm:grid-cols-[1fr_7.5rem]">
        <div className="space-y-1.5">
          <Label htmlFor={personId}>Add someone</Label>
          <FormSelect id={personId} name="userId" defaultValue="" required>
            <option value="" disabled>
              Choose a person
            </option>
            {assignable.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} — {person.email}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={roleId}>Role</Label>
          <FormSelect id={roleId} name="role" defaultValue="MEMBER">
            <option value="MEMBER">Member</option>
            <option value="LEAD">Lead</option>
          </FormSelect>
        </div>
      </div>

      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? (
          <SpinnerGapIcon aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <UserPlusIcon aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Adding…" : "Add to project"}
      </Button>
    </form>
  );
}
