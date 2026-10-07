import { SeriesChart } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/period-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "@/components/app-link";
import { NoAccess } from "@/components/no-access";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { last30Days, resolvePeriod, todayIso } from "@/lib/period";

type SellerRow = {
  id: number;
  name: string;
  status?: string;
  sales_total: string;
  sales_count: number;
  bookings_total: string;
  bookings_count: number;
};
type DeveloperRow = {
  id: number;
  employee_number: string;
  full_name: string;
  building: string | null;
  deposits: string;
  deposit_count: number;
  spending: string;
  spending_count: number;
  balance: string;
};
type FinanceStats = {
  period?: { date_from?: string; date_to?: string; days?: number };
  buildings?: { id: number; name?: string; code?: string }[] | null;
  money?: {
    developer_accounts?: { count?: number; total_balance?: string };
    deposits?: { total?: string; count?: number };
    spending?: { total?: string; count?: number };
    daily?: { date: string; deposits?: string; spending?: string }[];
  };
  sellers?: SellerRow[];
  developers?: DeveloperRow[];
};

function amount(value: string | null | undefined) {
  return value == null ? "—" : Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function FinanceStatsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; rank?: string }> }) {
  const session = await requireSession();
  const locale = await getLocale();
  if (!can(session.user, "finance.view")) {
    return <NoAccess description="Your account cannot open finance statistics." />;
  }
  const query = await searchParams;
  const today = todayIso();
  const period = resolvePeriod(query, last30Days(today));
  let stats: FinanceStats | null = null;
  let error: string | null = null;
  try {
    stats = await djangoFetch<FinanceStats>(`/api/v1/stats/finance/?date_from=${period.start}&date_to=${period.end}`, { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load finance statistics.";
  }
  const money = stats?.money;
  const sellers = stats?.sellers ?? [];
  const scope = stats?.buildings;
  const chartHeight = Math.max(200, sellers.length * 44 + 80);
  const sales = sellers.map((row) => ({
    name: row.name,
    href: `/sellers/${row.id}`,
    sales: Number(row.sales_total),
    bookings: Number(row.bookings_total),
  }));
  const rank = query.rank === "count" ? "count" : "total";
  const developers = [...(stats?.developers ?? [])].sort((a, b) =>
    rank === "count"
      ? b.deposit_count - a.deposit_count || Number(b.deposits) - Number(a.deposits)
      : Number(b.deposits) - Number(a.deposits) || b.deposit_count - a.deposit_count,
  );
  const rankHref = (value: string) =>
    `/finance/statistics?${new URLSearchParams({ from: period.start, to: period.end, rank: value })}`;
  const daily = (money?.daily ?? []).map((day) => ({ name: day.date.slice(5), deposits: Number(day.deposits ?? 0), spending: Number(day.spending ?? 0) }));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Finance statistics")}</h1>
        <p className="text-muted-foreground text-sm">
          {period.start} {t(locale, "to")} {period.end}
          {scope ? ` · ${scope.map((building) => building.name || building.code).filter(Boolean).join(", ")}` : ""}
        </p>
      </div>
      <PeriodPicker path="/finance/statistics" period={period} today={today} locale={locale} keep={{ rank: rank === "count" ? "count" : undefined }} />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Deposits", amount(money?.deposits?.total), `${money?.deposits?.count ?? 0} ${t(locale, "deposits")}`],
          ["Spending", amount(money?.spending?.total), `${money?.spending?.count ?? 0} ${t(locale, "payments")}`],
          ["Money held", amount(money?.developer_accounts?.total_balance), t(locale, "Developer balances now")],
        ].map(([label, value, hint]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{t(locale, label)}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
              <p className="text-muted-foreground text-sm">{hint}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Sales by seller")}</CardTitle>
            <CardDescription>{t(locale, "Confirmed till sales and court bookings in the period. Click a bar to open the seller.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart
              data={sales}
              layout="vertical"
              stacked
              height={chartHeight}
              series={[
                { key: "sales", label: t(locale, "Till sales"), color: "var(--chart-1)" },
                { key: "bookings", label: t(locale, "Court bookings"), color: "var(--chart-3)" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Developer money")}</CardTitle>
            <CardDescription>{t(locale, "Deposits and spending each day.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart
              data={daily}
              series={[
                { key: "deposits", label: t(locale, "Deposits"), color: "var(--chart-3)" },
                { key: "spending", label: t(locale, "Spending"), color: "var(--chart-1)" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Sellers")}</CardTitle>
          <CardDescription>
            {scope
              ? t(locale, "Sales count only counters in your buildings.")
              : t(locale, "Sorted by sales and bookings in the period.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {sellers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No sellers yet.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "Seller")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Till sales")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Court bookings")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link href={`/sellers/${row.id}`} className="underline-offset-4 hover:underline">{row.name}</Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{amount(row.sales_total)} <span className="text-muted-foreground">({row.sales_count})</span></TableCell>
                    <TableCell className="text-right tabular-nums">{amount(row.bookings_total)} <span className="text-muted-foreground">({row.bookings_count})</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <CardTitle>{t(locale, "Developers by deposits")}</CardTitle>
            <CardDescription>
              {t(locale, "Developers with deposits or spending in the period. Balance is now.")}
            </CardDescription>
          </div>
          <div className="flex gap-1 rounded-lg border p-1 text-sm">
            {[
              ["total", "By deposit total"],
              ["count", "By deposit count"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={rankHref(value)}
                className={`rounded-md px-3 py-1 ${rank === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {t(locale, label)}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="max-h-[36rem] overflow-auto">
          {developers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No deposits or spending in this period.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-right">#</TableHead>
                  <TableHead>{t(locale, "Employee number")}</TableHead>
                  <TableHead>{t(locale, "Name")}</TableHead>
                  <TableHead>{t(locale, "Building")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Deposits")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Deposit count")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Spending")}</TableHead>
                  <TableHead className="text-right">{t(locale, "Balance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{index + 1}</TableCell>
                    <TableCell className="tabular-nums">{row.employee_number}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/developers/${row.id}`} className="underline-offset-4 hover:underline">{row.full_name}</Link>
                    </TableCell>
                    <TableCell>{row.building ?? "—"}</TableCell>
                    <TableCell className={`text-right tabular-nums ${rank === "total" ? "font-semibold" : ""}`}>{amount(row.deposits)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${rank === "count" ? "font-semibold" : ""}`}>{row.deposit_count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {amount(row.spending)} <span className="text-muted-foreground">({row.spending_count})</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{amount(row.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
