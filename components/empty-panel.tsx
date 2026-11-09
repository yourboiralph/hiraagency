export function EmptyPanel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-lg font-medium tracking-[-0.01em]">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
