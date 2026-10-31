export function EmptyState({
  icon,
  phase,
  title,
  description,
}: {
  icon: React.ReactNode;
  phase: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {phase}
      </p>
      <h1 className="mt-2 text-lg font-semibold">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
