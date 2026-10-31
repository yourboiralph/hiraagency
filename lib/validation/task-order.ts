import { z } from "zod";

export const taskOrderSchema = z.object({
  projectId: z.string().min(1, "Missing project"),
  title: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(120, "Use 120 characters or fewer"),
  brief: z
    .string()
    .trim()
    .max(2000, "Use 2000 characters or fewer")
    .transform((value) => (value.length > 0 ? value : null)),
});

export const taskOrderIdSchema = z.object({
  taskOrderId: z.string().min(1, "Missing task order"),
});

export const taskOrderStatusSchema = taskOrderIdSchema.extend({
  status: z.enum(["OPEN", "CLOSED"]),
});

export const taskOrderVisibilitySchema = taskOrderIdSchema.extend({
  hidden: z.enum(["true", "false"]),
});
