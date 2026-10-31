import type { Metadata } from "next";
import { CalendarCheckIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/authz";

export const metadata: Metadata = {
  title: "My activity",
};

export default async function MyActivityPage() {
  await requireUser();

  return (
    <EmptyState
      icon={<CalendarCheckIcon aria-hidden="true" className="size-5" />}
      phase="Coming later"
      title="Your history will appear here"
      description="A calendar of the days you checked in and the work you submitted, so you can see your own consistency."
    />
  );
}
