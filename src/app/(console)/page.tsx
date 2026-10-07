import { Hint, AutoText } from "@/components/auto-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/app-link";
import { SeriesChart } from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { redirect } from "next/navigation";
import { djangoFetch } from "@/lib/django";
import { can, canOpen, getSession } from "@/lib/current-user";
import {
  CalendarCheck,
  CreditCard,
  Package,
  Radio,
  ScrollText,
  ShoppingCart,
  Store,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type CountPage = { count: number };
type Dashboard = {
  attendance?: { date: string; present: number; incomplete: number }[];
  scans?: { date: string; accepted: number; refused: number }[];
};

const STATS: {
  label: string;
  hint: string;
  permission: string;
  path: string;
  icon: LucideIcon;
}[] = [
  { label: "Developers", hint: "People on file", permission: "developer.view", path: "/api/v1/developers/?page_size=1", icon: UserRound },
  { label: "Cards", hint: "RFID cards", permission: "card.view", path: "/api/v1/rfid/cards/?page_size=1", icon: CreditCard },
  { label: "Readers", hint: "Registered readers", permission: "reader.view", path: "/api/v1/rfid/devices/?page_size=1", icon: Radio },
  { label: "Users", hint: "Accounts that can sign in", permission: "user.view", path: "/api/v1/users/?page_size=1", icon: Users },
  { label: "Attendance days", hint: "Stored daily rows", permission: "attendance.view", path: "/api/v1/attendance/daily/?page_size=1", icon: CalendarCheck },
  { label: "Audit events", hint: "Recorded changes", permission: "audit.view", path: "/api/v1/audit-logs/?page_size=1", icon: ScrollText },
  { label: "Wallets", hint: "Developer balances", permission: "finance", path: "/api/v1/finance/accounts/?page_size=1", icon: Wallet },
  { label: "Goods", hint: "Items for sale", permission: "good.view", path: "/api/v1/goods/?page_size=1", icon: Package },
  { label: "Purchases", hint: "Till orders", permission: "purchase", path: "/api/v1/purchases/?page_size=1", icon: ShoppingCart },
  { label: "Sellers", hint: "Sellers on file", permission: "seller", path: "/api/v1/sellers/?page_size=1", icon: Store },
];

async function loadCount(token: string, path: string) {
  try {
    const page = await djangoFetch<CountPage>(path, { accessToken: token });
    return page.count.toLocaleString();
  } catch {
    return "—";
  }
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;
  // The BOSS has no dashboard in the menu: company statistics is their home page.
  const { roles } = session.user;
  if (roles.includes("BOSS") && !roles.includes("ADMIN") && can(session.user, "stats.view")) redirect("/stats");

  const visible = STATS.filter((stat) => can(session.user, stat.permission) || canOpen(session.user, stat.permission));
  const [values, charts, locale] = await Promise.all([
    Promise.all(visible.map((stat) => loadCount(session.token, stat.path))),
    djangoFetch<Dashboard>("/api/v1/stats/dashboard/", { accessToken: session.token }).catch(() => ({}) as Dashboard),
    getLocale(),
  ]);
  const sum = (rows: Record<string, number | string>[] | undefined, key: string) =>
    (rows ?? []).reduce((total, row) => total + Number(row[key] ?? 0), 0);
  const name = session.user.full_name || session.user.username;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight"><AutoText>Hello,</AutoText> {name}</h1>
        <Hint>Live totals, and the last 14 days below.</Hint>
      </div>
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:transition-transform *:data-[slot=card]:hover:-translate-y-0.5 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader>
                  <CardTitle>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-[color-mix(in_oklch,var(--primary),var(--brand-2)_55%)] text-primary-foreground shadow-md shadow-primary/25">
                      <Icon className="size-4.5" />
                    </div>
                  </CardTitle>
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{values[index]}</div>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <Hint>{stat.hint}</Hint>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nothing to summarize yet</CardTitle>
            <CardDescription>This account has no company-wide lists.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {charts.attendance || charts.scans ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {charts.attendance ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div className="grid gap-1.5">
                  <CardTitle>Attendance</CardTitle>
                  <CardDescription>
                    {t(locale, "People at work each day: a complete day, or an incomplete one (a scan missing).")}
                  </CardDescription>
                </div>
                <Link href="/attendance/statistics" className="text-primary text-sm underline-offset-4 hover:underline">
                  Statistics
                </Link>
              </CardHeader>
              <CardContent>
                <SeriesChart
                  data={charts.attendance.map((day) => ({ name: day.date.slice(5), present: day.present, incomplete: day.incomplete }))}
                  series={[
                    { key: "present", label: t(locale, "Complete day"), color: "var(--chart-1)" },
                    { key: "incomplete", label: t(locale, "Incomplete"), color: "var(--chart-4)" },
                  ]}
                  stacked
                  height={260}
                />
                <p className="mt-2 text-muted-foreground text-xs tabular-nums">
                  {t(locale, "14 days")}: {sum(charts.attendance, "present").toLocaleString("en-US")} {t(locale, "complete")} · {sum(charts.attendance, "incomplete").toLocaleString("en-US")} {t(locale, "incomplete")}
                </p>
              </CardContent>
            </Card>
          ) : null}
          {charts.scans ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div className="grid gap-1.5">
                  <CardTitle>Card scans</CardTitle>
                  <CardDescription>{t(locale, "Taps at doors and tills each day: accepted, or refused (unknown, blocked or unassigned card).")}</CardDescription>
                </div>
                <Link href="/scans" className="text-primary text-sm underline-offset-4 hover:underline">
                  Scans
                </Link>
              </CardHeader>
              <CardContent>
                <SeriesChart
                  data={charts.scans.map((day) => ({ name: day.date.slice(5), accepted: day.accepted, refused: day.refused }))}
                  series={[
                    { key: "accepted", label: t(locale, "Accepted"), color: "var(--chart-3)" },
                    { key: "refused", label: t(locale, "Refused"), color: "var(--destructive)" },
                  ]}
                  stacked
                  height={260}
                />
                <p className="mt-2 text-muted-foreground text-xs tabular-nums">
                  {t(locale, "14 days")}: {sum(charts.scans, "accepted").toLocaleString("en-US")} {t(locale, "accepted")} · {sum(charts.scans, "refused").toLocaleString("en-US")} {t(locale, "refused")}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
