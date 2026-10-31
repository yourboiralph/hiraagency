import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

/**
 * Native select, styled to match `Input`. Native is deliberate: these selects
 * live inside plain `<form action={serverAction}>` markup, and the value has to
 * arrive in FormData without extra client state.
 */
export function FormSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground",
          className,
        )}
      >
        {children}
      </select>
      <CaretDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
