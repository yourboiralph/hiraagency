"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  ClipboardTextIcon,
  FolderOpenIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SquaresFourIcon,
  UserCircleIcon,
  type Icon,
} from "@phosphor-icons/react";

import { signOutAction } from "@/app/(app)/actions";
import { HiraLogo } from "@/components/hira-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavUser = {
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "MEMBER";
  canReview: boolean;
  notificationCount: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  adminOnly?: boolean;
  reviewerOnly?: boolean;
  badge?: number;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Work",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
      { href: "/projects", label: "Projects", icon: FolderOpenIcon },
      { href: "/me", label: "My profile", icon: UserCircleIcon },
    ],
  },
  {
    label: "Review",
    items: [
      {
        href: "/reviews",
        label: "Reviews",
        icon: ClipboardTextIcon,
        reviewerOnly: true,
      },
      {
        href: "/notifications",
        label: "Notifications",
        icon: BellIcon,
        reviewerOnly: true,
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        href: "/admin",
        label: "Admin",
        icon: ShieldCheckIcon,
        adminOnly: true,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  orientation,
}: {
  item: NavItem;
  pathname: string;
  orientation: "vertical" | "horizontal";
}) {
  const active = isActive(pathname, item.href);
  const IconComponent = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 text-[14px] font-medium transition-colors",
        orientation === "vertical" ? "py-2.5" : "shrink-0 whitespace-nowrap py-2",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <IconComponent
        aria-hidden="true"
        weight={active ? "fill" : "regular"}
        className="size-4 shrink-0"
      />
      {item.label}
      {item.badge ? (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
            active
              ? "bg-sidebar-primary-foreground text-sidebar-primary"
              : "bg-sidebar-primary text-sidebar-primary-foreground",
          )}
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SignOutButton({ compact = true }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className={
          compact
            ? "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            : "w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }
        aria-label="Sign out"
      >
        <SignOutIcon aria-hidden="true" className="size-4" />
        {compact ? null : "Sign out"}
      </Button>
    </form>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <HiraLogo
        size={compact ? 36 : 44}
        className="ring-1 ring-white/10"
      />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-medium tracking-[-0.01em] text-sidebar-foreground",
            compact ? "text-[14px]" : "text-[15px]",
          )}
        >
          HiraAgency
        </span>
        <span className="mt-0.5 block font-mono text-xs text-sidebar-foreground/60">
          Workspace
        </span>
      </span>
    </Link>
  );
}

export function AppSidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter(
        (item) =>
          (!item.adminOnly || user.role === "ADMIN") &&
          (!item.reviewerOnly || user.canReview),
      )
      .map((item) =>
        item.href === "/notifications"
          ? { ...item, badge: user.notificationCount }
          : item,
      ),
  })).filter((group) => group.items.length > 0);

  const flatItems = groups.flatMap((group) => group.items);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-5 pb-5 pt-6">
          <Brand />
        </div>

        <nav
          aria-label="Main"
          className="flex-1 overflow-y-auto px-3 pb-4"
        >
          {groups.map((group) => (
            <div key={group.label} className="pb-1 pt-5 first:pt-1">
              <p className="px-3 pb-1.5 text-[13px] font-medium text-sidebar-foreground/50">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    orientation="vertical"
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <UserAvatar name={user.name} image={user.image} size="md" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate font-mono text-xs text-sidebar-foreground/60">
                {user.role === "ADMIN" ? "Admin" : "Member"}
              </p>
            </div>
            <ThemeToggle className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand compact />
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <UserAvatar name={user.name} image={user.image} size="xs" />
            <SignOutButton />
          </div>
        </div>
        <nav
          aria-label="Main"
          className="flex gap-1 overflow-x-auto px-3 pb-2"
        >
          {flatItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              orientation="horizontal"
            />
          ))}
        </nav>
      </header>
    </>
  );
}
