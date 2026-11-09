import Image from "next/image";

import { cn } from "@/lib/utils";

/** The Hira mark. Decorative here: the wordmark beside it names the brand. */
export function HiraLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/hira-logo.svg"
      alt=""
      width={size}
      height={size}
      unoptimized
      priority
      className={cn("shrink-0 rounded-lg object-contain", className)}
    />
  );
}
