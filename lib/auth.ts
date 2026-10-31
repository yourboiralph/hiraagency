import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

/**
 * Auth.js prefers `AUTH_URL` over the incoming request host when it builds
 * absolute redirect URLs. A `http://localhost:3000` value copied from
 * `.env.local` into a hosting provider therefore sends every sign-in and
 * sign-out to the developer's machine. In production the request host is the
 * only correct source, so a localhost value is ignored.
 *
 * This runs before `NextAuth()` reads the environment, and it is a guard, not a
 * configuration style: simply leave `AUTH_URL` unset everywhere.
 */
function discardLocalAuthUrl() {
  if (process.env.NODE_ENV !== "production") return;

  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const value = process.env[key]?.trim();
    if (!value) continue;

    try {
      const { hostname } = new URL(value);
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "[::1]";

      if (!isLocal) continue;

      delete process.env[key];
      console.warn(
        `[auth] Ignoring ${key}=${value} in production; redirects follow the request host instead.`,
      );
    } catch {
      // Not parseable as a URL — Auth.js would ignore it as well.
    }
  }
}

discardLocalAuthUrl();

/**
 * Auth.js v5, credentials-only.
 *
 * No Prisma adapter is registered on purpose:
 *  - The Credentials provider never persists users or accounts.
 *  - Credentials sign-in is incompatible with database sessions anyway, so
 *    Auth.js forces JWT sessions here.
 * The `Account` / `Session` / `VerificationToken` tables stay in the schema so
 * an OAuth provider can be added later without a migration.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    // One long shift. Users re-authenticate the next working day.
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        // Runs bcrypt even when the user is missing, so a wrong email and a
        // wrong password take the same time to answer.
        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user?.passwordHash,
        );

        if (!user || !user.isActive || !passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the sign-in request.
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.mustChangePassword = token.mustChangePassword;
      return session;
    },
  },
});
