import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters")
      .max(128, "Use 128 characters or fewer"),
    confirm: z.string().min(1, "Re-enter the new password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
