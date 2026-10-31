import { AppSidebar } from "@/components/app-shell/sidebar";
import { requireUser } from "@/lib/authz";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
