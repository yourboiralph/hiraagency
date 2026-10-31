"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateTempPassword } from "@/lib/temp-password";
import { fieldErrorsOf } from "@/lib/validation/errors";
import { createUserSchema, userIdSchema } from "@/lib/validation/user";

export type Credentials = {
  name: string;
  email: string;
  tempPassword: string;
};

export type AddUserState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
  /** Shown once, never stored in plain text. */
  credentials?: Credentials;
};

export type ResetPasswordState = {
  formError?: string;
  credentials?: Credentials;
};

function revalidatePeopleSurfaces() {
  // New or re-activated people change every "assignable" list.
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/projects", "layout");
}

export async function createUserAction(
  _previous: AddUserState,
  formData: FormData,
): Promise<AddUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const tempPassword = generateTempPassword();

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: await hashPassword(tempPassword),
        // Forces the password change on first sign in.
        mustChangePassword: true,
      },
    });
  } catch {
    return { formError: "The account could not be created. Try again." };
  }

  revalidatePeopleSurfaces();

  return {
    ok: true,
    credentials: {
      name: parsed.data.name,
      email: parsed.data.email,
      tempPassword,
    },
  };
}

export async function resetPasswordAction(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return { formError: "Missing person." };

  const person = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, email: true },
  });

  if (!person) return { formError: "That account no longer exists." };

  const tempPassword = generateTempPassword();

  try {
    await db.user.update({
      where: { id: person.id },
      data: {
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
      },
    });
  } catch {
    return { formError: "The password could not be reset. Try again." };
  }

  revalidatePeopleSurfaces();

  return {
    credentials: {
      name: person.name,
      email: person.email,
      tempPassword,
    },
  };
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;

  // Deactivating yourself would lock the last admin out mid-session.
  if (parsed.data.userId === admin.id) return;

  const nextActive = formData.get("isActive") === "true";

  try {
    await db.user.update({
      where: { id: parsed.data.userId },
      data: { isActive: nextActive },
    });
  } catch {
    // Account removed between render and submit.
    return;
  }

  revalidatePeopleSurfaces();
}
