import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 rounded-md text-[11px]",
  md: "size-9 rounded-lg text-xs",
  lg: "size-11 rounded-xl text-sm",
} as const;

/**
 * The project's identity chip. Tinted with the project color instead of filled:
 * a saturated block of color at every row would fight the status colors.
 */
export function ProjectMark({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: `${color}1F`, color }}
      className={cn(
        "grid shrink-0 place-items-center font-mono font-semibold",
        SIZES[size],
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
