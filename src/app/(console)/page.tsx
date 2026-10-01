import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSlot } from "@/components/chart-panel";
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

const STATS: {
  label: string;
  hint: string;
  permission: string;
  path: string;
  icon: LucideIcon;
}[] = [
  { label: "Developers", hint: "People on file", permission: "developer.view", path: "/api/v1/developers/?page_size=1", icon: UserRound },
  { label: "Cards", hint: "RFID cards", permission: "rfid.view", path: "/api/v1/rfid/cards/?page_size=1", icon: CreditCard },
  { label: "Readers", hint: "Registered readers", permission: "rfid.view", path: "/api/v1/rfid/devices/?page_size=1", icon: Radio },
  { label: "Users", hint: "Accounts that can sign in", permission: "user.view", path: "/api/v1/users/?page_size=1", icon: Users },
  { label: "Attendance days", hint: "Stored daily rows", permission: "attendance.view", path: "/api/v1/attendance/daily/?page_size=1", icon: CalendarCheck },
  { label: "Audit events", hint: "Recorded changes", permission: "audit.view", path: "/api/v1/audit-logs/?page_size=1", icon: ScrollText },
  { label: "Wallets", hint: "Developer balances", permission: "finance", path: "/api/v1/finance/accounts/?page_size=1", icon: Wallet },
  { label: "Goods", hint: "Items for sale", permission: "goods", path: "/api/v1/goods/?page_size=1", icon: Package },
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

  const visible = STATS.filter((stat) => can(session.user, stat.permission) || canOpen(session.user, stat.permission));
  const values = await Promise.all(visible.map((stat) => loadCount(session.token, stat.path)));
  const name = session.user.full_name || session.user.email;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Hello, {name}</h1>
        <p className="text-muted-foreground text-sm">Live totals from the company API. Charts will sit under them.</p>
      </div>
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader>
                  <CardTitle>
                    <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                  </CardTitle>
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{values[index]}</div>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{stat.hint}</p>
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
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSlot title="Attendance" caption="Daily presence will be charted here." />
        <ChartSlot title="Card scans" caption="Scan results over time will be charted here." />
      </div>
    </div>
  );
}
