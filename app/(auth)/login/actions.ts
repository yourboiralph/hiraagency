"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";

export type LoginState = {
  formError?: string;
  fieldErrors?: { email?: string; password?: string };
  values?: { email?: string };
};

/** Only allow same-origin relative paths as a post-login destination. */
function safeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);

    return {
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
      values: { email: typeof raw.email === "string" ? raw.email : "" },
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirect(formData.get("next")),
    });
  } catch (error) {
    // NEXT_REDIRECT on success is not an AuthError and must propagate.
    if (error instanceof AuthError) {
      return {
        formError: "Email or password is incorrect.",
        values: { email: parsed.data.email },
      };
    }
    throw error;
  }

  return {};
}
