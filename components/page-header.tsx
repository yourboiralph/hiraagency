import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  eyebrow?: string;
}) {
  return (
    <header className="space-y-5">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-xs font-medium text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="[overflow-wrap:anywhere] text-3xl font-medium tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
