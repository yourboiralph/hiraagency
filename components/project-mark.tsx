import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 rounded-md text-[11px]",
  md: "size-9 rounded-lg text-xs",
  lg: "size-11 rounded-xl text-sm",
} as const;

/**
 * The project's identity chip: its picture when one is set, otherwise the
 * colored initial. Tinted rather than filled so a row of projects does not
 * fight the status colors.
 */
export function ProjectMark({
  name,
  color,
  image = null,
  size = "md",
}: {
  name: string;
  color: string;
  image?: string | null;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: `${color}1F`, color }}
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden font-mono font-semibold",
        SIZES[size],
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media/${image}`}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
