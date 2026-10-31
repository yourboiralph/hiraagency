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
    <header className="space-y-4">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
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
