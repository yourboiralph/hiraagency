"use server";

import { z } from "zod";

import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setPasswordSchema } from "@/lib/validation/auth";

export type SetPasswordState = {
  formError?: string;
  fieldErrors?: { password?: string; confirm?: string };
};

export async function setPasswordAction(
  _previous: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const user = await requireUser({ allowPasswordChange: true });

  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);

    return {
      fieldErrors: {
        password: fieldErrors.password?.[0],
        confirm: fieldErrors.confirm?.[0],
      },
    };
  }

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!current) {
    return { formError: "This account is no longer available." };
  }

  const reusingTempPassword = await verifyPassword(
    parsed.data.password,
    current.passwordHash,
  );

  if (reusingTempPassword) {
    return { formError: "Choose a password different from the temporary one." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    },
  });

  // Sign out so the session JWT is reissued without the stale flag.
  await signOut({ redirectTo: "/login?changed=1" });

  return {};
}
