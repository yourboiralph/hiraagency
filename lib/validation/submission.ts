import { z } from "zod";

import { MAX_BACKDATE_DAYS, isAllowedWorkDate, parseWorkDate } from "@/lib/date";
import { MAX_SUBMISSION_LINKS } from "@/lib/submission-constants";
import { normalizeUrl, platformOf } from "@/lib/url";

export const submissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Say what you did in a few words")
    .max(120, "Use 120 characters or fewer"),
  notes: z
    .string()
    .trim()
    .max(1000, "Use 1000 characters or fewer")
    .transform((value) => (value.length > 0 ? value : null)),
});

export type ParsedSubmission = {
  title: string;
  notes: string | null;
  workDate: string;
  links: {
    url: string;
    label: string | null;
    platform: string | null;
  }[];
};

type ParseResult =
  | { ok: true; data: ParsedSubmission }
  | { ok: false; formError?: string; fieldErrors: Record<string, string> };

/**
 * Date and links are handled outside zod: the date needs the workday helpers,
 * and each link needs an error key the form can attach to its own row.
 */
export function parseSubmission(formData: FormData): ParseResult {
  const fieldErrors: Record<string, string> = {};

  const parsed = submissionSchema.safeParse({
    title: formData.get("title") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    const { fieldErrors: zodErrors } = z.flattenError(parsed.error);
    for (const [field, messages] of Object.entries(zodErrors)) {
      const first = (messages as string[] | undefined)?.[0];
      if (first) fieldErrors[field] = first;
    }
  }

  const rawDate = String(formData.get("workDate") ?? "");
  const workDate = parseWorkDate(rawDate);

  if (!workDate) {
    fieldErrors.workDate = "Choose a valid date";
  } else if (!isAllowedWorkDate(workDate)) {
    fieldErrors.workDate = `Choose today or up to ${MAX_BACKDATE_DAYS} days back`;
  }

  const urls = formData.getAll("url").map((value) => String(value));
  const labels = formData.getAll("label").map((value) => String(value));

  const links: ParsedSubmission["links"] = [];

  urls.forEach((raw, index) => {
    if (!raw.trim()) return;

    const url = normalizeUrl(raw);
    if (!url) {
      fieldErrors[`url-${index}`] = "Enter a full web address";
      return;
    }

    links.push({
      url,
      label: labels[index]?.trim() || null,
      platform: platformOf(url),
    });
  });

  const providedCount = urls.filter((raw) => raw.trim().length > 0).length;

  if (providedCount === 0) {
    fieldErrors.links = "Add at least one link";
  } else if (links.length > MAX_SUBMISSION_LINKS) {
    fieldErrors.links = `Add at most ${MAX_SUBMISSION_LINKS} links`;
  }

  if (Object.keys(fieldErrors).length > 0 || !parsed.success || !workDate) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      title: parsed.data.title,
      notes: parsed.data.notes,
      workDate,
      links,
    },
  };
}
