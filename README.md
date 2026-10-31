# HiraAgency Workspace

Internal agency ops: daily check-ins and project work submissions.

Members check in once per workday, then submit the links they produced against a
project they belong to. Admins create projects, add members, and review
submissions.

Full design and roadmap: [`PLAN.md`](./PLAN.md).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon Postgres |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| Auth | Auth.js v5, credentials, JWT sessions |
| UI | shadcn/ui (Base UI), Tailwind v4, Phosphor icons |
| Type | Fira Sans (UI), Fira Code (data) |

## Setup

```bash
npm install
```

Create your local env file and fill in the Neon connection strings:

```bash
# PowerShell
Copy-Item .env.example .env.local
```

```bash
# bash
cp .env.example .env.local
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Apply the schema and create the first admin:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:push` | Push schema without a migration (prototyping) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Create/refresh the admin account |
| `npm run db:generate` | Regenerate the Prisma client |

## Layout

```
app/                 routes
  (auth)/            public: login, set-password
  (app)/             member area, requires a session
  (admin)/           admin area, requires role=ADMIN
components/ui/       shadcn primitives
lib/
  db.ts              Prisma client + Neon adapter (singleton)
  date.ts            Asia/Manila workday helpers
  generated/prisma/  generated client (gitignored)
prisma/
  schema.prisma
  seed.mts
```

## Notes

- **Workdays are Asia/Manila dates**, stored as `DATE`. All date math lives in
  `lib/date.ts` and runs on the server. Never compute "today" on the client.
- **Prisma 7 has no bundled query engine** — the Neon driver adapter is
  required, not optional.
- **`cacheComponents` is disabled.** Every route is authenticated, so there is
  no static shell to prerender. See `PLAN.md` §5b.
- Migrations use `DIRECT_URL`; runtime queries use the pooled `DATABASE_URL`.
