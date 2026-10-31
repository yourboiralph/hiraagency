import {
  ArrowCounterClockwiseIcon,
  ArchiveIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { setProjectStatusAction } from "../actions";

export function ProjectStatusCard({
  projectId,
  status,
}: {
  projectId: string;
  status: "ACTIVE" | "ARCHIVED";
}) {
  const archiving = status === "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {archiving ? "Archive project" : "Restore project"}
        </CardTitle>
        <CardDescription>
          {archiving
            ? "Archived projects keep their history and members, but drop out of the active project count."
            : "Restoring puts the project back into everyone's active list."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={setProjectStatusAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="status"
            value={archiving ? "ARCHIVED" : "ACTIVE"}
          />
          <Button type="submit" variant="outline" size="sm">
            {archiving ? (
              <ArchiveIcon aria-hidden="true" className="size-4" />
            ) : (
              <ArrowCounterClockwiseIcon
                aria-hidden="true"
                className="size-4"
              />
            )}
            {archiving ? "Archive" : "Restore"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
