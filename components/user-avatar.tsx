import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[9px]",
  sm: "size-8 text-[10px]",
  md: "size-9 text-[11px]",
  lg: "size-11 text-xs",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Photo when the person has one, initials otherwise. */
export function UserAvatar({
  name,
  image = null,
  size = "md",
  className,
}: {
  name: string;
  image?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/media/${image}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={cn(
          "shrink-0 rounded-full object-cover",
          SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-muted font-mono font-medium",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
