import { z } from "zod";

/** First message per field, in the shape the forms expect. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const { fieldErrors } = z.flattenError(error);
  const result: Record<string, string> = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) result[field] = first;
  }

  return result;
}
