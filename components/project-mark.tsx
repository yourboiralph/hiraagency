import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 rounded-lg text-[11px]",
  md: "size-10 rounded-xl text-xs",
  lg: "size-12 rounded-2xl text-[13px]",
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
