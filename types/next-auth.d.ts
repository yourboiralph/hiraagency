import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    mustChangePassword: boolean;
  }
}

// `next-auth/jwt` only re-exports `@auth/core/jwt`, so augmenting it has no
// effect — the interface has to be merged on the module that declares it.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    mustChangePassword: boolean;
  }
}
