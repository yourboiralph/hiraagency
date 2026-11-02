"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheckIcon,
  ClipboardTextIcon,
  FolderOpenIcon,
  SignOutIcon,
  SquaresFourIcon,
  ShieldCheckIcon,
  type Icon,
} from "@phosphor-icons/react";

import { signOutAction } from "@/app/(app)/actions";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavUser = {
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "MEMBER";
  canReview: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  adminOnly?: boolean;
  reviewerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
  { href: "/projects", label: "Projects", icon: FolderOpenIcon },
  { href: "/me", label: "My profile", icon: CalendarCheckIcon },
  {
    href: "/reviews",
    label: "Reviews",
    icon: ClipboardTextIcon,
    reviewerOnly: true,
  },
  { href: "/admin", label: "Admin", icon: ShieldCheckIcon, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  items,
  pathname,
  orientation,
}: {
  items: NavItem[];
  pathname: string;
  orientation: "vertical" | "horizontal";
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-0.5"
          : "flex gap-1 overflow-x-auto",
      )}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              orientation === "horizontal" && "shrink-0 whitespace-nowrap",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <IconComponent
              aria-hidden="true"
              weight={active ? "fill" : "regular"}
              className="size-4 shrink-0"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant={compact ? "ghost" : "ghost"}
        size={compact ? "icon-sm" : "sm"}
        className={compact ? undefined : "w-full justify-start gap-2 text-muted-foreground"}
        aria-label="Sign out"
      >
        <SignOutIcon aria-hidden="true" className="size-4" />
        {compact ? null : "Sign out"}
      </Button>
    </form>
  );
}

export function AppSidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || user.role === "ADMIN") &&
      (!item.reviewerOnly || user.canReview),
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-md bg-primary font-mono text-xs font-semibold text-primary-foreground"
          >
            H
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">HiraAgency</p>
            <p className="text-[11px] text-muted-foreground">Workspace</p>
          </div>
        </div>

        <div className="flex-1 px-3">
          <NavLinks items={items} pathname={pathname} orientation="vertical" />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <UserAvatar name={user.name} image={user.image} size="md" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {user.role === "ADMIN" ? "Administrator" : "Member"}
              </p>
            </div>
            <SignOutButton compact />
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-md bg-primary font-mono text-[11px] font-semibold text-primary-foreground"
            >
              H
            </span>
            <span className="text-sm font-semibold">HiraAgency</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={user.name} image={user.image} size="xs" />
            <SignOutButton compact />
          </div>
        </div>
        <div className="px-3 pb-2">
          <NavLinks items={items} pathname={pathname} orientation="horizontal" />
        </div>
      </header>
    </>
  );
}
