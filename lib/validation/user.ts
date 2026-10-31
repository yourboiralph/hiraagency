import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(80, "Use 80 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter an email address")
    .email("Enter a valid email address")
    .max(160, "Use 160 characters or fewer"),
  role: z.enum(["ADMIN", "MEMBER"], "Choose a role"),
});

export const userIdSchema = z.object({
  userId: z.string().min(1, "Missing person"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
