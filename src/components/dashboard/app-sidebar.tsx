"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ComponentProps } from "react";
import { ChevronRight, type LucideIcon, LayoutDashboard, UserRound, CreditCard, Radio, ScanLine, CalendarCheck, Users, ScrollText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/dashboard/nav-user";
import type { CurrentUser } from "@/lib/current-user";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

type Child = { title: string; href: string; permission: string | null };

type Group = {
  title: string;
  icon: LucideIcon;
  children: Child[];
};

const GROUPS: Group[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    children: [
      { title: "Dashboard", href: "/", permission: null },
      { title: "Account", href: "/account", permission: null },
    ],
  },
  {
    title: "Developers",
    icon: UserRound,
    children: [
      { title: "All", href: "/developers", permission: "developer.view" },
      { title: "Active", href: "/developers?status=ACTIVE", permission: "developer.view" },
      { title: "On leave", href: "/developers?status=ON_LEAVE", permission: "developer.view" },
      { title: "Suspended", href: "/developers?status=SUSPENDED", permission: "developer.view" },
      { title: "Terminated", href: "/developers?status=TERMINATED", permission: "developer.view" },
    ],
  },
  {
    title: "Cards",
    icon: CreditCard,
    children: [
      { title: "All", href: "/cards", permission: "rfid.view" },
      { title: "Active", href: "/cards?status=ACTIVE", permission: "rfid.view" },
      { title: "Blocked", href: "/cards?status=BLOCKED", permission: "rfid.view" },
      { title: "Retired", href: "/cards?status=RETIRED", permission: "rfid.view" },
      { title: "Unassigned", href: "/cards?assigned=false", permission: "rfid.view" },
    ],
  },
  {
    title: "Readers",
    icon: Radio,
    children: [
      { title: "All", href: "/readers", permission: "rfid.view" },
      { title: "Active", href: "/readers?is_active=true", permission: "rfid.view" },
      { title: "Inactive", href: "/readers?is_active=false", permission: "rfid.view" },
    ],
  },
  {
    title: "Scans",
    icon: ScanLine,
    children: [
      { title: "All", href: "/scans", permission: "rfid.view" },
      { title: "Accepted", href: "/scans?result=ACCEPTED", permission: "rfid.view" },
      { title: "Unknown", href: "/scans?result=UNKNOWN_CARD", permission: "rfid.view" },
      { title: "Blocked", href: "/scans?result=BLOCKED_CARD", permission: "rfid.view" },
    ],
  },
  {
    title: "Attendance",
    icon: CalendarCheck,
    children: [
      { title: "Daily", href: "/attendance", permission: "attendance.view" },
      { title: "Records", href: "/attendance/records", permission: "attendance.view" },
    ],
  },
  {
    title: "Users",
    icon: Users,
    children: [
      { title: "All users", href: "/users", permission: "user.view" },
      { title: "Active", href: "/users?is_active=true", permission: "user.view" },
      { title: "Inactive", href: "/users?is_active=false", permission: "user.view" },
      { title: "New user", href: "/users/new", permission: "user.manage" },
      { title: "Roles", href: "/users/roles", permission: "role.view" },
    ],
  },
  {
    title: "Audit",
    icon: ScrollText,
    children: [{ title: "Log", href: "/audit", permission: "audit.view" }],
  },
];

function allowed(user: CurrentUser, permission: string | null) {
  return permission === null || user.permissions.includes(permission);
}

function NavGroup({
  group,
  pathname,
  search,
}: {
  group: Group & { children: Child[] };
  pathname: string;
  search: URLSearchParams;
}) {
  const active = group.children.some((child) => childActive(child.href, pathname, search));
  const [expanded, setExpanded] = useState(active);
  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);
  const Icon = group.icon;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={group.title}>
            <Icon />
            <span>{group.title}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={childActive(child.href, pathname, search)}>
                  <Link href={child.href}>{child.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
function childActive(href: string, pathname: string, search: { get(key: string): string | null; keys(): Iterable<string> }) {
  const url = new URL(href, "http://local");
  if (url.pathname !== pathname) return false;
  const expected = [...url.searchParams.entries()];
  if (expected.length === 0) return [...search.keys()].length === 0;
  return expected.every(([key, value]) => search.get(key) === value);
}

export function AppSidebar({ user, ...props }: ComponentProps<typeof Sidebar> & { user: CurrentUser }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((state) => ({
      sidebarVariant: state.values.sidebar_variant,
      sidebarCollapsible: state.values.sidebar_collapsible,
      isSynced: state.isSynced,
    })),
  );
  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const groups = GROUPS.map((group) => ({
    ...group,
    children: group.children.filter((child) => allowed(user, child.permission)),
  })).filter((group) => group.children.length > 0);

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/">
                <LayoutDashboard />
                <span className="font-semibold text-base">Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => (
                <NavGroup key={group.title} group={group} pathname={pathname} search={search} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
