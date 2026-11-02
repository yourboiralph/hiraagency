import { Badge } from "@/components/ui/badge";
import type {
  ProjectStatus,
  SubmissionStatus,
  TaskOrderStatus,
} from "@/lib/generated/prisma/enums";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "ARCHIVED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Archived
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-primary/30 bg-primary/10 text-primary"
    >
      Active
    </Badge>
  );
}

export function RoleBadge({ role }: { role: "ADMIN" | "MEMBER" }) {
  if (role === "ADMIN") {
    return (
      <Badge
        variant="outline"
        className="border-warning/30 bg-warning/10 text-warning"
      >
        Administrator
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Member
    </Badge>
  );
}

export function SubmissionStatusBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  if (status === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className="border-primary/30 bg-primary/10 text-primary"
      >
        Approved
      </Badge>
    );
  }

  if (status === "NEEDS_REVISION") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        Needs revision
      </Badge>
    );
  }

  if (status === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/50 bg-destructive/15 text-destructive"
      >
        Rejected
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-warning/30 bg-warning/10 text-warning"
    >
      Pending review
    </Badge>
  );
}

export function TaskOrderStatusBadge({ status }: { status: TaskOrderStatus }) {
  if (status === "CLOSED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Closed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
      Open
    </Badge>
  );
}

export function HiddenBadge() {
  return (
    <Badge
      variant="outline"
      className="border-warning/30 bg-warning/10 text-warning"
    >
      Hidden
    </Badge>
  );
}
