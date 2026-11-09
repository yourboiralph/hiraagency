# HiraAgency Workspace — Build Plan

**Status:** Plan approved (v1.0)
**Stack:** Next.js (App Router) · Prisma · Auth.js v5 · Neon Postgres · shadcn/ui · Tailwind v4
**Timezone of record:** `Asia/Manila` (UTC+8)

---

## 1. Product

Internal agency operations app. Not public, no self-signup.

- **Admin** creates projects, adds members, reviews submissions.
- **Member** sees only projects they belong to.
- Each workday a member **checks in** (attendance). This is tracked.
- That day — or a backdated day — they **submit work as one or more links** against a project.
- Admin sees: who checked in, who submitted, what's pending review.

Two distinct concepts, kept separate:

| Concept | Meaning | Table |
|---|---|---|
| **Login** | Authenticate with email + password | `User`, `Session` |
| **Check-in** | "I am working today" | `Attendance` |

---

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Framework version | Next.js **16.x stable** (pinned, not caret) |
| Auth | Email + password, **admin-created accounts only** |
| Review | Approve / Needs-revision, per submission |
| Check-in | Explicit button, separate from login, with check-out |
| Workday boundary | `Asia/Manila`, 00:00–23:59 |
| ORM | Prisma |
| Auth library | Auth.js v5 (NextAuth) |
| UI | shadcn/ui + Tailwind v4 + Phosphor icons |

---

## 3. Architecture

```
app/
  (auth)/login/                 public
  (app)/                        requires session
    dashboard/
    projects/
      [slug]/
      [slug]/submit/
    me/
  (admin)/                      requires role=ADMIN
    admin/
    admin/projects/
    admin/projects/[id]/members/
    admin/users/
    admin/reviews/
  api/auth/[...nextauth]/
  api/health/
lib/
  db.ts            Prisma singleton
  auth.ts          Auth.js config + credentials provider
  authz.ts         requireUser / requireAdmin / requireProjectAccess
  date.ts          Manila workday helpers
  validation/      Zod schemas
  platform.ts      URL → platform detection
prisma/
  schema.prisma
  seed.ts
components/
  ui/              shadcn primitives
  check-in-card.tsx
  submission-form.tsx
  link-input-list.tsx
  attendance-table.tsx
```

**Data flow:** Server Components read via Prisma directly. Mutations are **Server Actions** wrapped in Zod validation + `requireProjectAccess()`. No client-side fetching for initial data.

---

## 4. Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // migrations
}

enum Role             { ADMIN MEMBER }
enum ProjectRole      { LEAD MEMBER }
enum ProjectStatus    { ACTIVE ARCHIVED }
enum SubmissionStatus { PENDING APPROVED NEEDS_REVISION REJECTED }
enum TaskOrderStatus  { OPEN CLOSED }
enum NotificationType { SUBMISSION_SUBMITTED }

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String
  image            String?
  passwordHash     String
  mustChangePassword Boolean @default(true)   // admin sets temp password
  role             Role     @default(MEMBER)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  accounts      Account[]
  sessions      Session[]
  memberships   ProjectMember[]  @relation("MembershipUser")
  addedMembers  ProjectMember[]  @relation("MembershipAdder")
  attendance    Attendance[]
  submissions   Submission[]     @relation("Author")
  reviews       Submission[]     @relation("Reviewer")
  createdProjects Project[]      @relation("ProjectCreator")
  createdTaskOrders TaskOrder[]  @relation("TaskOrderCreator")
}

// --- Auth.js adapter models (standard shapes) ---
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// --- Domain ---

model Project {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique
  description String?
  image       String?       // object key in Neon Object Storage
  color       String        @default("#22C55E")
  status      ProjectStatus @default(ACTIVE)
  createdById String
  createdBy   User          @relation("ProjectCreator", fields: [createdById], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  members     ProjectMember[]
  submissions Submission[]
}

model ProjectMember {
  projectId   String
  userId      String
  role        ProjectRole @default(MEMBER)
  addedById   String?
  createdAt   DateTime    @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation("MembershipUser",  fields: [userId],    references: [id], onDelete: Cascade)
  addedBy User?   @relation("MembershipAdder", fields: [addedById], references: [id])

  @@id([projectId, userId])
  @@index([userId])
}

// A brief posted inside a project. Leads/admins create and close it; members
// attach submissions to it while it is OPEN.
model TaskOrder {
  id          String          @id @default(cuid())
  projectId   String
  title       String
  brief       String?
  status      TaskOrderStatus @default(OPEN)
  hidden      Boolean         @default(false)   // hidden from members
  createdById String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy   User        @relation("TaskOrderCreator", fields: [createdById], references: [id])
  submissions Submission[]

  @@index([projectId, status])
}

model Attendance {
  id         String    @id @default(cuid())
  userId     String
  workDate   DateTime  @db.Date          // Manila calendar date
  checkInAt  DateTime  @default(now())
  checkOutAt DateTime?
  note       String?
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, workDate])           // one check-in per user per day
  @@index([workDate])
}

model Submission {
  id           String           @id @default(cuid())
  authorId     String
  projectId    String
  taskOrderId  String?          // optional: work can be free-form
  workDate     DateTime         @db.Date
  title        String
  notes        String?
  status       SubmissionStatus @default(PENDING)
  reviewedById String?
  reviewedAt   DateTime?
  reviewNote   String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  author    User             @relation("Author",   fields: [authorId],     references: [id], onDelete: Cascade)
  reviewer  User?            @relation("Reviewer", fields: [reviewedById], references: [id])
  project   Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskOrder TaskOrder?       @relation(fields: [taskOrderId], references: [id], onDelete: SetNull)
  links     SubmissionLink[]
  images    SubmissionImage[]

  @@index([projectId, workDate])
  @@index([authorId, workDate])
  @@index([status])
  @@index([taskOrderId])
}

model SubmissionLink {
  id           String @id @default(cuid())
  submissionId String
  url          String
  platform     String?   // youtube | drive | figma | notion | dropbox | other
  label        String?
  position     Int      @default(0)

  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
}

// Pictures attached to a submission; bytes live in Neon Object Storage.
model SubmissionImage {
  id           String @id @default(cuid())
  submissionId String
  key          String
  position     Int    @default(0)

  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
}

// One per reviewer per submission; read when reviewed or cleared manually.
model Notification {
  id           String           @id @default(cuid())
  recipientId  String
  submissionId String?
  type         NotificationType @default(SUBMISSION_SUBMITTED)
  readAt       DateTime?
  createdAt    DateTime         @default(now())

  recipient  User        @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  submission Submission? @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([recipientId, readAt])
  @@index([submissionId])
}
```

---

## 5. Auth design

**Critical constraint:** Auth.js **Credentials provider does not work with database sessions**. It requires `session: { strategy: "jwt" }`. So:

- Session strategy: **JWT**
- `User`/`Account`/`Session` models still exist (Prisma adapter installed for future OAuth), but credentials logins issue JWTs.
- JWT callback injects `id` and `role`; `session` callback exposes them.
- Hashing: `bcryptjs` (pure JS, safe on Vercel edge-less runtimes).

**Admin-created account flow:**
1. Admin creates user → system generates a temp password → shown once in the UI.
2. `mustChangePassword = true`.
3. `proxy.ts` forces `/set-password` until cleared.
4. No password reset by email (no mail provider yet) — admin can re-issue a temp password.

**Route protection:** `proxy.ts` guards `(app)` and `(admin)`. Every server action *also* re-checks — the proxy is not authorization.

> Next.js 16 renamed `middleware.ts` → `proxy.ts` and the export `middleware` → `proxy`.
> `proxy.ts` runs on the **Node.js runtime only** (not configurable). That's fine for Auth.js,
> which needs Node anyway.

---

## 5b. Next.js 16 specifics

Pinned to **16.x stable**. Behaviours that shape the code:

| Change | Impact |
|---|---|
| `proxy.ts` replaces `middleware.ts` | auth gating lives in `proxy.ts`, export named `proxy` |
| Turbopack is default for `dev` and `build` | no `--turbopack` flag needed; watch for plugin incompat |
| `params` / `searchParams` are async | every dynamic page: `const { slug } = await params` |
| `cookies()` / `headers()` are async | `await cookies()` in server actions |
| React 19 | no legacy `forwardRef` needed; shadcn components updated for React 19 |
| `next lint` removed | use ESLint CLI with flat config |
| `images.domains` removed | use `images.remotePatterns` |
| `revalidateTag` takes a second arg | use `revalidateTag(tag, profile)` or `updateTag()` in actions |

**Caveat:** `next-auth@5` is still a beta line. Before scaffolding I'll verify the installed
version against Next 16 and pin an exact version in `package.json` (no `^`) so a beta bump
can't silently break auth.

---

## 5c. Implementation notes (recorded during Phase 0–1)

These differ from the original assumptions and are now the real state of the repo.

| Topic | Reality | Consequence |
|---|---|---|
| **Prisma version** | `7.10.1` (the registry's `latest` for the `prisma` CLI is an **8.0.0-rc**, so it is pinned to 7.x) | Pin exact versions for `prisma` + `@prisma/client`; never `npm i prisma@latest` |
| **Prisma 7 query engine** | The Rust engine is gone. **A driver adapter is mandatory.** | `lib/db.ts` uses `PrismaNeon`; `new PrismaClient()` with no adapter throws |
| **`directUrl` removed** | `prisma.config.ts` only accepts `datasource.url` | CLI points at `DIRECT_URL`, app points at pooled `DATABASE_URL` |
| **Config file name** | `prisma init` generated `prisma7.config.ts` | keep it; the CLI auto-discovers it |
| **shadcn style** | `base-nova` builds on **Base UI**, not Radix | component props differ (e.g. `<TooltipProvider delay>` not `delayDuration`) |
| **`cacheComponents`** | Template enabled it; reading `cookies()` outside `<Suspense>` is a build error | disabled in `next.config.ts` — every route is authenticated |
| **Auth pin** | `next-auth@5.0.0-beta.32` | exact pin, no caret |
| **JWT type augmentation** | `next-auth/jwt` only re-exports `@auth/core/jwt` | augment `declare module "@auth/core/jwt"`, otherwise `token.id` stays `unknown` |
| **Password change** | Server action updates the hash, clears `mustChangePassword`, then `signOut({ redirectTo: "/login?changed=1" })` | the stale flag never survives in a JWT; user re-authenticates once |
| **Login timing** | `verifyPassword` runs bcrypt against a dummy hash when the email is unknown | wrong email and wrong password cost the same |
| **Proxy scope** | `proxy.ts` checks cookie *presence* only | real authorization is `requireUser` / `requireAdmin` in `lib/authz.ts` |
| **Session truth** | `getSessionUser` re-reads the account (active flag, role, temp-password flag) and is memoized with React `cache()` | deactivating or demoting someone takes effect on their next request, not when the JWT expires; the read is deduped per request |
| **Project slugs** | Generated once from the name; renames never change them | links shared in chat keep working |
| **Project detail screen** | Details, members and archive live on `/admin/projects/[id]` instead of a separate `/members` route | one screen for one job; the plan's route list was updated |
| **Native selects** | `components/form-select.tsx` wraps `<select>` | these forms post to server actions; a native control puts the value in `FormData` with no client state |
| **One-time credentials** | Account creation and password reset return a generated temp password in the action state and show it in a dialog once | nothing plain-text is ever persisted; the UI blocks dismissal until the admin acknowledges |
| **Dialog success step** | "New project" swaps to a `Project created` step with *Done* / *Add members* instead of closing from an effect | closing the popup from an effect inside the action transition did not stick; an explicit step is also better UX |
| **Who counts as expected** | Every **active account**, administrators included | a membership-based rule would make today's denominator change as people are added to projects; one rule is explainable. Revisit with an `expectsCheckIn` flag if admin-only accounts ever exist |
| **Check-in idempotency** | `upsert` with an empty `update` | a double click or a second tab cannot create a second row or move the original check-in time |
| **Check-out** | `updateMany` where `checkOutAt` is null | a second click cannot overwrite the time someone actually stopped; no row is not an error |
| **Times in the UI** | Server components format every timestamp and duration before rendering | avoids hydration mismatches from the client clock and keeps all math in `Asia/Manila` |
| **Link storage** | Every URL runs through `normalizeUrl` (adds `https://`, allows only http/https), platform is detected from the hostname, `position` preserves order | pasting `figma.com/file/…` works; `javascript:` and `data:` can never be stored |
| **Who can submit** | Project members only — administrators included. Admins can still *read* every project | reading and authoring are separate rights |
| **Backdating** | Today or up to `MAX_BACKDATE_DAYS` back, rejected server-side; future dates never allowed | the date input's `min`/`max` mirrors it, but the server is the gate |
| **Feed timestamps** | "logged" time for today's entries, calendar date for backdated ones | the group heading is the *work* date; the stamp says when it was actually added |
| **Pending count** | Members see their own pending submissions; admins see the agency total | a member's dashboard should not report on colleagues' queues |
| **Review decisions** | `updateMany` filtered on `status: "PENDING"`; a zero count becomes "already reviewed" | two admins clicking at once cannot overwrite each other, and the loser gets a clear message instead of silence |
| **Revision notes** | Required (3-500 chars) for *needs revision*; approve is one click, no note | the member needs to know what to fix; approval needs no explanation |
| **Review feedback** | No toast after a decision; the item leaves the queue and the empty state takes over | the queue itself is the confirmation, and a success step would be shown on an item that no longer exists |
| **Decision visibility** | Feed shows the badge, the reviewer name and date, and the note (red-tinted when sent back) | members see *who* decided and *when*, not just a color |
| **Redirect origin** | `AUTH_URL` / `NEXTAUTH_URL` are never set. In production a localhost value is discarded before `NextAuth()` reads the environment | Auth.js prefers `AUTH_URL` over the request host; a `.env.local` value copied to Vercel sent every sign-in/sign-out to `localhost`. The request host is the only correct origin behind a proxy |
| **Task orders** | A `TaskOrder` belongs to one project; only project leads and global admins create or close them. Submissions take an optional `taskOrderId` | members can still submit free-form work; attaching is opt-in. Closing blocks new attachments, and `onDelete: SetNull` would keep history if an order were ever deleted |
| **Closed orders** | The submit form only offers `OPEN` orders, and the action re-checks status before insert | a form loaded before someone closed the order cannot slip work in |
| **Order context** | Order page lists its own submissions; the project feed and review queue show the order title as a chip | work stays findable from either direction |
| **Hiding an order** | `hidden` boolean. Members lose it from the project page, the submit selector and direct URLs; the order chip on attached submissions is suppressed for them too. Leads/admins keep the badge and controls | removes clutter without deleting history, and the hidden title never leaks through a submission |
| **Deleting an order** | Hard delete. `Submission.taskOrderId` is `onDelete: SetNull` | attached work survives in the project feed, simply detached; the delete dialog spells out the count and consequence |
| **Media storage** | Neon Object Storage through `@aws-sdk/client-s3` (path-style, SigV4). The browser gets a 5-minute presigned PUT, uploads directly, and the database stores only the object key | image bytes stay out of Postgres and clear of Vercel's request-body limit |
| **Private media** | `/api/media/[...key]` requires a session. Keys are `<kind>/<userId>/<uuid>.<ext>`; saving re-checks the prefix and calls `HeadObject` | a leaked URL is useless without a session, and a member cannot attach somebody else's upload |
| **Upload limits** | Avatars 2 MB; project covers and each submission picture 5 MB; up to 6 pictures per submission; JPEG, PNG or WebP | enforced in the uploader and again on save |
| **Image fallbacks** | Project covers fall back to the colored initial, avatars to initials | records without images keep rendering exactly as before |
| **Review access** | `requireReviewer`: admins review everything; leads review only projects where they are LEAD. Every action re-checks the submission's project | scoping is enforced at the write, not only by what the queue shows |
| **Rejection** | New final status `REJECTED` with a required reason (3-500 chars). All three decisions run `updateMany` on `status: "PENDING"` | final by design; no undo path, and two reviewers cannot race |
| **Rejected task orders** | A rejected submission blocks that member from attaching new work to the same order; other submissions that day are unaffected | matches the rule: no more work for that order, still free to work that day |
| **Bucket CORS** | The Neon bucket must allow browser `PUT`/`GET`/`HEAD` from the app origins with `Content-Type` allowed | presigned uploads are cross-origin; without CORS the upload fails in the browser |
| **Feed filter** | The project feed defaults to `PENDING`; `?status=approved` and `?status=all` are URL state. Needs-revision and rejected entries appear under All | server-rendered links, no client state, and the view is shareable/bookmarkable |
| **Review identity** | Review cards lead with the author's avatar and name; the project is a small line with a color dot | the queue is about the person's work, and showing the project first read as the project itself being reviewed |
| **Notifications** | Created on submit for every active admin plus the project's leads, excluding the author. Marked read by a review decision, or by "Mark all as read" | reviewers find out without polling; the count means unhandled work |
| **Notification surfaces** | Sidebar badge + `/notifications`, dashboard "Waiting for review" card, per-project pending badges | the same event is visible where reviewers already look |
| **Submission privacy** | Members see another person's submission (author, time, title, status) but not notes, links or images. Authors see their own; leads and admins see all. `listProjectSubmissions` filters links/images at the query, then strips notes for everyone else | the URLs never enter a member's payload, so the UI is not the only gate |

---

## 6. Date handling (the part that breaks attendance apps)

All workday math goes through `lib/date.ts`:

```ts
export const TZ = "Asia/Manila";

/** YYYY-MM-DD in Manila, regardless of server TZ */
export function workDateToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export function workDateOf(d: Date): string { /* same, for any instant */ }
```

Rules:
- `workDate` is **always** computed server-side. Never `new Date()` on the client.
- Stored as `@db.Date` (no time, no TZ drift).
- "Today" in the UI comes from a server prop, not `Date.now()`.
- Backdating allowed up to N days (default 7), never future dates.

---

## 7. Design system

Generated with `ui-ux-pro-max` → query `"saas admin dashboard operations"`, dials `density 8 / motion 3 / variance 4`.

**Pattern:** Real-Time / Operations — data-dense but scannable, status colors, live indicators labeled honestly.
**Style:** overridden from *Glassmorphism* → **solid surfaces + 1px borders**. Frosted cards hurt scanability on dense tables. Same palette, flatter treatment.

### Tokens

| Role | Dark (default) | Light |
|---|---|---|
| `--background` | `#0F172A` | `#F8FAFC` |
| `--card` | `#1B2336` | `#FFFFFF` |
| `--border` | `#334155` | `#E2E8F0` |
| `--foreground` | `#F8FAFC` | `#0F172A` |
| `--muted` | `#272F42` | `#F1F5F9` |
| `--muted-foreground` | `#94A3B8` | `#475569` |
| `--primary` | `#22C55E` | `#16A34A` |
| `--on-primary` | `#0F172A` | `#FFFFFF` |
| `--destructive` | `#EF4444` | `#DC2626` |
| `--warning` | `#F59E0B` | `#D97706` |
| `--info` | `#38BDF8` | `#0284C7` |
| `--ring` | `#22C55E` | `#16A34A` |

### Type
- **UI:** Fira Sans 400 / 500 / 600
- **Data:** Fira Code 400 / 500 — URLs, timestamps, counts, IDs
- Scale: 12 / 14 / 16 / 20 / 24 / 32

### Space & motion
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 (dense dashboard rhythm)
- Radius: 8px · Borders: 1px
- Motion: 150–250ms, `power1.out`, all wrapped in `prefers-reduced-motion`

### Semantic status (used everywhere, never ad-hoc)
| State | Color |
|---|---|
| Checked in | `--primary` (green) |
| Not checked in yet | `--warning` (amber) |
| Absent / overdue | `--destructive` (red) |
| Pending review | `--warning` |
| Approved | `--primary` |
| Needs revision | `--destructive` |

### UX rules enforced
- Validate on **blur**, not submit-only
- Failed submit → **focusable error summary at top**, inline errors retained
- Every mutation shows loading → success/error
- Real empty states, never blank tables
- Icons: Phosphor (`@phosphor-icons/react`), SVG only, no emoji
- Contrast ≥ 4.5:1 body text, both themes; focus rings visible on every interactive element
- Verify at 375 / 768 / 1024 / 1440

---

## 8. Screens

### Auth
- `/login` — email + password, error summary, no signup link
- `/set-password` — forced on first login

### Member
- `/dashboard` — check-in card (3 states: not checked in / working / done), "Waiting for review" for reviewers, today's work, project summary
- `/projects` — cards: project color, member count, pending count for reviewers, my last submission
- `/projects/[slug]` — task orders section, feed grouped by day and filtered by status (Pending by default; Approved / All), member avatars, my status per day
- `/projects/[slug]/task-orders/[id]` — brief, open/closed state, work attached to the order
- `/projects/[slug]/submit` — date picker (≤ today, ≥ -7d), title, optional task order, N links, up to 6 pictures, notes
- `/me` — profile picture and account; check-in/submission history still pending
- `/reviews` — visible to admins and project leads; a lead sees only projects they lead. Approve / request revision / reject with a reason
- `/notifications` — unread submission notifications for reviewers, mark all as read

### Admin
- `/admin` — today's attendance (checked in n/m, missing list with times), entry points to projects and people
- `/admin/projects` — list + create
- `/admin/projects/[id]` — details, members, archive/restore (details and members share one screen on purpose)
- `/admin/users` — create user, issue temp password, reset password, deactivate
- `/admin/reviews` — legacy path, redirects to `/reviews`

---

## 9. Phases

| # | Phase | Done when |
|---|---|---|
| 0 | Scaffold | ✅ Next dev runs, Neon migrated, admin seeded, tokens applied |
| 1 | Auth | ✅ Admin logs in, temp-password flow works, proxy blocks `/admin` for members |
| 2 | Projects | ✅ Admin creates project + adds member; member sees only their projects |
| 3 | Attendance | ✅ Member checks in once/day; admin sees checked-in vs missing for today |
| 4 | Submissions | ✅ Member submits N links for a date; appears in project feed |
| 5 | Review | ✅ Admin approves / requests revision; member sees status |
| 5b | Task orders | ✅ Leads/admins post briefs; members attach work; closing blocks new submissions |
| 5c | Media | ✅ Submission pictures, project covers and avatars on Neon Object Storage |
| 5d | Rejection | ✅ Leads review their projects; reject with a reason; rejected orders close to that member |
| 5e | Notifications | ✅ Sidebar badge, inbox, dashboard card and project pending counts for reviewers |
| 6 | Polish | Heatmap, empty states, a11y pass, mobile, dark/light, seed data |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `next-auth@5` is beta | pin exact version, verify against Next 16 at install, smoke-test login before building features |
| Next 16 async `params`/`cookies` | type every page/action with `await`, no sync access |
| Credentials + DB sessions incompatibility | JWT strategy, documented above |
| Neon connection limits / cold starts | pooled `DATABASE_URL` + `DIRECT_URL` for migrations, Prisma singleton in `lib/db.ts` |
| Timezone drift on attendance | all workday math server-side via `lib/date.ts`, `@db.Date` storage |
| `prisma generate` missing on Vercel | `postinstall: prisma generate` |
| Temp passwords shown in plaintext | display once, never store; hash immediately |
| No email provider | admin re-issues temp passwords; add Resend later |
| Unbounded backdating | cap at 7 days, reject future dates |
| N+1 on project feeds | `include` + indexes; measure before optimizing |

---

## 11. Environment

Template committed as **`.env.example`**. Copy to `.env.local`:

```bash
DATABASE_URL="postgresql://...-pooler.../hira_agency?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://.../hira_agency?sslmode=require"
AUTH_SECRET="<openssl rand -base64 32>"
# AUTH_URL is deliberately absent: Auth.js derives the origin from the request,
# which is correct locally and on every Vercel deployment.
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_NAME="HiraAgency Workspace"
APP_TIMEZONE="Asia/Manila"
MAX_BACKDATE_DAYS="7"
AWS_ENDPOINT_URL_S3="https://br-xxxx.storage.c-2.ap-southeast-1.aws.neon.tech"
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="<credential token_id>"
AWS_SECRET_ACCESS_KEY="<credential s3_secret_access_key>"
NEON_STORAGE_BUCKET="hira-media"
SEED_ADMIN_EMAIL="admin@hiraagency.com"
SEED_ADMIN_NAME="Admin"
SEED_ADMIN_PASSWORD=""
```

Neon setup: create project `hira-agency`, branch `main`, copy pooled + direct strings. Use a separate branch for local dev if you want isolation. Create a **private** storage bucket and a `storage:read` + `storage:write` credential; allow the app origins in the bucket CORS for `PUT`, `GET` and `HEAD`.
