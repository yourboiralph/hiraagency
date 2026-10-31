import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The create-next-app template turns on Cache Components, which makes any
  // `cookies()` read outside a <Suspense> boundary a build error. Every route
  // in this app is authenticated, so there is no static shell worth
  // prerendering. Dynamic rendering is simpler and correct here.
  // See PLAN.md §5b.
  cacheComponents: false,

  // Prisma 7 has no Rust query engine; the Neon driver adapter must stay
  // outside the bundle.
  serverExternalPackages: ["@prisma/client", "@neondatabase/serverless"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
