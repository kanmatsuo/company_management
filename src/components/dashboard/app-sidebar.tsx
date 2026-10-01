"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { ChevronRight, type LucideIcon, LayoutDashboard, UserRound, CreditCard, Radio, ScanLine, CalendarCheck, Users, ScrollText, Wallet, Package, Warehouse, ShoppingCart, Store, Landmark, Briefcase } from "lucide-react";
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
import { canManage, canOpen } from "@/lib/permissions";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

type Child = { title: string; href: string; permission?: string | null; anyOf?: string[]; manage?: string[] };

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
      { title: "Rentals", href: "/rentals", permission: null },
      { title: "My bookings", href: "/bookings/me", permission: null },
      { title: "Rental schedule", href: "/bookings", permission: null },
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
      { title: "Birthdays this month", href: `/developers?birthday_month=${new Date().getMonth() + 1}`, permission: "developer.view" },
      { title: "New", href: "/developers/new", permission: "developer.view", manage: ["developer"] },
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
      { title: "Assignments", href: "/assignments", permission: "rfid.view" },
      { title: "New", href: "/cards/new", permission: "rfid.view", manage: ["rfid"] },
    ],
  },
  {
    title: "Readers",
    icon: Radio,
    children: [
      { title: "All", href: "/readers", permission: "rfid.view" },
      { title: "Offline", href: "/readers?online=false", permission: "rfid.view" },
      { title: "Doors", href: "/readers?purpose=ATTENDANCE", permission: "rfid.view" },
      { title: "Till readers", href: "/readers?purpose=TILL", permission: "rfid.view" },
      { title: "Buildings", href: "/buildings", permission: "rfid.view" },
      { title: "New device", href: "/readers/new", permission: "rfid.view", manage: ["rfid"] },
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
      { title: "Who is inside", href: "/occupancy", permission: "attendance.view" },
      { title: "Daily", href: "/attendance", permission: "attendance.view" },
      { title: "Records", href: "/attendance/records", permission: "attendance.view" },
      { title: "Manual record", href: "/attendance/records/new", permission: "attendance.view", manage: ["attendance"] },
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
  {
    title: "Finance",
    icon: Wallet,
    children: [
      { title: "Wallets", href: "/finance/accounts", permission: "finance" },
      { title: "Transactions", href: "/finance/transactions", permission: "finance" },
      { title: "Deposit", href: "/finance/deposits", permission: "finance", manage: ["finance"] },
      { title: "Adjustment", href: "/finance/adjustments", permission: "finance", manage: ["finance"] },
    ],
  },
  {
    title: "Goods",
    icon: Package,
    children: [
      { title: "All", href: "/goods", anyOf: ["goods", "good", "seller"] },
      { title: "New", href: "/goods/new", anyOf: ["goods", "good", "seller"], manage: ["goods", "good", "seller"] },
    ],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    children: [{ title: "Movements", href: "/inventory", anyOf: ["inventory", "goods", "good", "seller"] }],
  },
  {
    title: "Purchases",
    icon: ShoppingCart,
    children: [
      { title: "All", href: "/purchases", anyOf: ["purchase", "seller"] },
      { title: "New", href: "/purchases/new", anyOf: ["purchase", "seller"], manage: ["purchase", "seller"] },
    ],
  },
  {
    title: "Sellers",
    icon: Store,
    children: [
      { title: "All", href: "/sellers", permission: "seller" },
      { title: "New", href: "/sellers/new", permission: "seller", manage: ["seller"] },
    ],
  },
  {
    title: "Positions",
    icon: Briefcase,
    children: [
      { title: "All", href: "/positions", anyOf: ["service", "position", "seller"] },
      { title: "New", href: "/positions/new", anyOf: ["service", "position", "seller"], manage: ["service", "position", "seller"] },
    ],
  },
  {
    title: "Seller finance",
    icon: Landmark,
    children: [
      { title: "Balances", href: "/seller-finance/accounts", anyOf: ["seller", "finance"] },
      { title: "Transactions", href: "/seller-finance/transactions", anyOf: ["seller", "finance"] },
      { title: "Payouts", href: "/seller-finance/payouts", anyOf: ["seller", "finance"] },
      { title: "Request payout", href: "/seller-finance/payouts/new", anyOf: ["seller", "finance"] },
      { title: "Adjustment", href: "/seller-finance/adjustments", anyOf: ["seller", "finance"], manage: ["seller", "finance"] },
    ],
  },
];

function allowed(user: CurrentUser, child: Child) {
  if (child.manage && !canManage(user, child.manage)) return false;
  if (child.anyOf) return child.anyOf.some((prefix) => canOpen(user, prefix));
  if (!child.permission) return child.permission === null;
  return user.permissions.includes(child.permission) || canOpen(user, child.permission);
}

function pathnameOf(href: string) {
  return new URL(href, "http://local").pathname;
}

function inSection(href: string, pathname: string) {
  const base = pathnameOf(href);
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavGroup({
  group,
  open,
  onOpenChange,
  pathname,
  search,
}: {
  group: Group & { children: Child[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  search: URLSearchParams;
}) {
  const Icon = group.icon;
  const exact = group.children.filter((child) => childActive(child.href, pathname, search));
  const nested = group.children
    .filter((child) => inSection(child.href, pathname))
    .sort((left, right) => pathnameOf(right.href).length - pathnameOf(left.href).length);
  const activeHref = exact[0]?.href ?? nested[0]?.href ?? null;

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={group.title}>
            <Icon />
            <span>{group.title}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {open ? (
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={child.href === activeHref}>
                    <Link href={child.href}>{child.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        ) : null}
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
    children: group.children.filter((child) => allowed(user, child)),
  })).filter((group) => group.children.length > 0);
  const activeTitle =
    groups.find((group) => group.children.some((child) => inSection(child.href, pathname)))?.title ?? null;
  const [openTitle, setOpenTitle] = useState<string | null>(activeTitle);
  const [trackedTitle, setTrackedTitle] = useState(activeTitle);
  if (activeTitle !== trackedTitle) {
    setTrackedTitle(activeTitle);
    setOpenTitle(activeTitle);
  }

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
                <NavGroup
                  key={group.title}
                  group={group}
                  open={openTitle === group.title}
                  onOpenChange={(next) => setOpenTitle(next ? group.title : null)}
                  pathname={pathname}
                  search={search}
                />
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
