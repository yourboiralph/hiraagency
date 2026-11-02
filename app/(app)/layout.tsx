import { AppSidebar } from "@/components/app-shell/sidebar";
import { canReview, requireUser } from "@/lib/authz";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const showReviews = await canReview(user);

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          canReview: showReviews,
        }}
      />
      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
