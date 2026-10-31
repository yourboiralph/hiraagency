import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Compared against when no user matches the email, so a missing account and a
 * wrong password cost the same time. Precomputed — hashing per request would
 * spend the exact CPU we are trying to hide.
 */
const DUMMY_HASH =
  "$2b$12$7tbvElzJ8h3hO2G1o4Amye6laNymHi98tmqMrC.DWyyo9QQ00Fr6m";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? DUMMY_HASH);

  // A null hash still pays the bcrypt cost above, but must never pass.
  return Boolean(hash) && matches;
}
