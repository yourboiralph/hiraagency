import Image from "next/image";

import { HiraLogo } from "@/components/hira-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <HiraLogo size={48} />
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

function StatPill({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/15 bg-[#0d1c42] shadow-xl",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
      )}
    >
      <p className="text-[12px] font-medium text-white/50">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[14px] font-medium text-white">
        <span className={cn("size-1.5 shrink-0 rounded-full", tone)} />
        {value}
      </p>
    </div>
  );
}

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
      {/* The creative work the workspace supports. */}
      <section className="relative order-2 flex flex-col justify-between overflow-hidden border-t border-border bg-[#010736] px-6 py-10 text-white lg:order-1 lg:min-h-dvh lg:border-t-0 lg:border-r lg:border-white/15 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_72%_62%,rgba(34,57,111,0.6),transparent_62%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#010736] to-transparent" />
        </div>

        <div className="animate-rise relative z-20 flex items-center justify-between gap-4">
          <p className="text-[13px] font-medium text-white/80">Hira Agency</p>
          <p className="font-mono text-xs text-white/60">Asia/Manila</p>
        </div>

        <div className="relative z-10 mt-8 flex-1">
          <h2 className="pointer-events-none absolute inset-x-0 top-0 z-0 select-none text-center font-heading text-[clamp(4rem,11vw,8rem)] font-semibold uppercase leading-[0.76] tracking-[-0.07em]">
            <span className="block bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-transparent">
              EDIT.
            </span>
            <span className="block bg-gradient-to-b from-white/90 via-white/55 to-white/10 bg-clip-text text-transparent">
              EARN.
            </span>
            <span className="block bg-gradient-to-b from-white/70 via-white/30 to-transparent bg-clip-text text-transparent">
              ENJOY
            </span>
          </h2>

          <div className="relative z-10 flex min-h-[440px] items-end justify-center pt-24 lg:h-full lg:min-h-0">
            <div
              aria-hidden="true"
              className="absolute bottom-8 left-1/2 h-24 w-[68%] -translate-x-1/2 rounded-[100%] bg-[#22396f]/50 blur-3xl"
            />
            <Image
              src="/minecraft-creeper.webp"
              alt="A Creeper editing a Minecraft video at a gaming desk"
              width={1600}
              height={1499}
              sizes="(min-width: 1024px) 36vw, 100vw"
              priority
              className="animate-rise relative z-10 h-auto max-h-[300px] w-auto max-w-full object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.45)] lg:max-h-[58vh]"
              style={{ animationDelay: "180ms" }}
            />
          </div>

          <div className="absolute left-0 top-10 z-20 hidden lg:block">
            <StatPill label="Check-in" value="09:12" tone="bg-[#7ee2b8]" />
          </div>
          <div className="absolute right-0 top-28 z-20 hidden lg:block">
            <StatPill label="Review" value="3 waiting" tone="bg-[#ffd166]" />
          </div>
          <div className="absolute bottom-12 left-4 z-20 hidden lg:block">
            <StatPill
              label="Submission"
              value="Approved"
              tone="bg-[#7ee2b8]"
            />
          </div>

          <div className="relative z-20 mt-4 grid grid-cols-3 gap-2 lg:hidden">
            <StatPill
              compact
              label="Check-in"
              value="09:12"
              tone="bg-[#7ee2b8]"
            />
            <StatPill
              compact
              label="Submission"
              value="Approved"
              tone="bg-[#7ee2b8]"
            />
            <StatPill
              compact
              label="Review"
              value="3 waiting"
              tone="bg-[#ffd166]"
            />
          </div>
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
