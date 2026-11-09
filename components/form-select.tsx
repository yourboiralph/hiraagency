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
          "h-11 w-full appearance-none rounded-lg border border-input bg-background/50 px-3 pr-9 text-base transition-[border-color,box-shadow,background-color] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive [&>option]:bg-popover [&>option]:text-popover-foreground",
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
