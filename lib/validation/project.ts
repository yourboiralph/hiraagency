import { z } from "zod";

/** Brand colors only. A free-form picker invites unreadable combinations. */
export const PROJECT_COLORS = [
  { value: "#22C55E", label: "Emerald" },
  { value: "#38BDF8", label: "Sky" },
  { value: "#A78BFA", label: "Violet" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#94A3B8", label: "Slate" },
] as const;

const colorValues = PROJECT_COLORS.map((color) => color.value);

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(60, "Use 60 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(280, "Use 280 characters or fewer")
    .transform((value) => (value.length > 0 ? value : null)),
  color: z.enum(colorValues, "Pick one of the available colors"),
});

export const projectIdSchema = z.object({
  projectId: z.string().min(1, "Missing project"),
});

export const memberSchema = z.object({
  projectId: z.string().min(1, "Missing project"),
  userId: z.string().min(1, "Choose a person"),
  role: z.enum(["LEAD", "MEMBER"], "Choose a project role"),
});

export const projectStatusSchema = projectIdSchema.extend({
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
