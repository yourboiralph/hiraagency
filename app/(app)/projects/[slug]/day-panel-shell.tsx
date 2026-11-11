"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The day panel sits under the grid. When a new day is picked, bring it into
 * view only if the viewer cannot already see it — on a tall screen nothing
 * moves, on a phone the day's work arrives right where the tap happened.
 * The first render never scrolls: a bookmarked day opens where it is.
 */
export function DayPanelShell({
  day,
  className,
  children,
}: {
  day: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastDay = useRef(day);

  useEffect(() => {
    if (lastDay.current === day) return;
    lastDay.current = day;

    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
    if (onScreen) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    node.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [day]);

  return (
    <div id="work-day" ref={ref} className={className}>
      {children}
    </div>
  );
}
