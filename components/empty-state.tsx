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
    <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-mono text-[13px] text-muted-foreground">{phase}</p>
      <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 max-w-sm text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
