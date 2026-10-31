import "server-only";

import { randomInt } from "node:crypto";

/**
 * No `i`, `l`, `o`, `0` or `1`: these passwords get read aloud and typed by
 * hand from a screen or a chat message.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Four groups of four. ~79 bits of entropy, well above the 12-character floor,
 * and short enough that an administrator can pass it on without a typo.
 */
export function generateTempPassword(): string {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
      "",
    ),
  ).join("-");
}
