import { AppSidebar } from "@/components/app-shell/sidebar";
import { getReviewerScope, requireUser } from "@/lib/authz";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const reviewer = await getReviewerScope(user);
  const notificationCount = reviewer.canReview
    ? await getUnreadNotificationCount(user.id)
    : 0;

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          canReview: reviewer.canReview,
          notificationCount,
        }}
      />
      <div className="md:pl-[264px]">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-10 md:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
