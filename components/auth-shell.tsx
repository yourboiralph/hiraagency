import {
  CheckCircleIcon,
  ClockCountdownIcon,
  FolderOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

import { ThemeToggle } from "@/components/theme-toggle";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-primary font-heading text-[15px] font-semibold text-primary-foreground"
      >
        H
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-medium tracking-[-0.01em]">
          HiraAgency
        </span>
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          Workspace
        </span>
      </span>
    </div>
  );
}

const PREVIEWS = [
  {
    label: "Check-in",
    value: "09:12",
    meta: "On time",
    icon: CheckCircleIcon,
    tone: "text-[#067647]",
  },
  {
    label: "Submission",
    value: "Homepage refresh",
    meta: "Approved",
    icon: FolderOpenIcon,
    tone: "text-[#067647]",
  },
  {
    label: "Review queue",
    value: "3 waiting",
    meta: "2 projects",
    icon: ClockCountdownIcon,
    tone: "text-[#b54708]",
  },
];

export function AuthShell({
  title,
  description,
  children,
  footnote,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      {/* The product itself, as live HTML: check-in, submission, review. */}
      <section className="order-2 flex flex-col justify-between gap-12 border-t border-border bg-[#010736] px-6 py-10 text-white lg:order-1 lg:border-t-0 lg:border-r lg:border-white/15 lg:p-12">
        <div className="animate-rise flex items-center justify-between gap-4">
          <p className="font-mono text-xs text-white/70">
            Internal agency operations
          </p>
          <p className="font-mono text-xs text-white/70">Asia/Manila</p>
        </div>

        <div className="max-w-xl">
          <h2
            className="animate-rise text-3xl font-medium leading-[1.05] tracking-[-0.03em] md:text-[2.75rem]"
            style={{ animationDelay: "60ms" }}
          >
            Check in, submit links, review the work.
          </h2>
          <p
            className="animate-rise mt-5 max-w-md text-base leading-relaxed text-white/75"
            style={{ animationDelay: "120ms" }}
          >
            One place for the workday, the links each person produced, and the
            decisions the leads make.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PREVIEWS.map((preview, index) => {
            const Icon = preview.icon;
            return (
              <div
                key={preview.label}
                className="animate-rise rounded-xl bg-white p-4 text-[#010736]"
                style={{ animationDelay: `${180 + index * 60}ms` }}
              >
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#22396f]">
                  <Icon
                    aria-hidden="true"
                    weight="fill"
                    className={`size-3.5 ${preview.tone}`}
                  />
                  {preview.label}
                </div>
                <p className="mt-3 truncate text-[15px] font-medium">
                  {preview.value}
                </p>
                <p className="mt-1 font-mono text-xs text-[#22396f]">
                  {preview.meta}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sign-in */}
      <section className="order-1 flex flex-col justify-center bg-card px-6 py-10 lg:order-2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Brand />
            <ThemeToggle />
          </div>

          <h1 className="text-3xl font-medium tracking-[-0.03em]">{title}</h1>
          <div className="mt-2 text-base leading-relaxed text-muted-foreground">
            {description}
          </div>

          <div className="mt-7">{children}</div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            {footnote ??
              "Accounts are created by an administrator. There is no self sign-up."}
          </p>
        </div>
      </section>
    </main>
  );
}
