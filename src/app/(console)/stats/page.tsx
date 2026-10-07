import { SeriesChart } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/period-picker";
import { NoAccess } from "@/components/no-access";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { last30Days, resolvePeriod, todayIso } from "@/lib/period";

type BuildingScope = { id: number; name?: string; code?: string };
type DayCount = { date: string; present?: number; avg_worked_hours?: number; deposits?: string; spending?: string };
type Stats = {
  period?: { date_from?: string; date_to?: string; days?: number };
  buildings?: BuildingScope[] | null;
  people?: {
    developers?: { total?: number; by_status?: Record<string, number>; by_building?: { building?: number | null; name?: string | null; count?: number }[] };
    inside_now?: { total?: number };
    attendance?: { days_with_attendance?: number; avg_present_per_day?: number; avg_worked_hours?: number; daily?: DayCount[] };
  };
  money?: {
    developer_accounts?: { count?: number; total_balance?: string };
    deposits?: { total?: string; count?: number };
    spending?: { total?: string; count?: number };
    daily?: DayCount[];
    store_sales?: { sales_total?: string; sales_count?: number; bookings_total?: string; bookings_count?: number };
  };
};

export default async function CompanyStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  if (!can(session.user, "stats.view")) return <NoAccess description="Your account cannot open company statistics." />;
  const query = await searchParams;
  const today = todayIso();
  const { start, end } = resolvePeriod(query, last30Days(today));
  let stats: Stats | null = null;
  let error: string | null = null;
  try {
    stats = await djangoFetch<Stats>(`/api/v1/stats/?date_from=${start}&date_to=${end}`, { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load company statistics.";
  }
  const people = stats?.people;
  const money = stats?.money;
  const scope = stats?.buildings;
  const attendance = (people?.attendance?.daily ?? []).map((day) => ({ name: day.date.slice(5), present: day.present ?? 0 }));
  const cash = (money?.daily ?? []).map((day) => ({ name: day.date.slice(5), deposits: Number(day.deposits ?? 0), spending: Number(day.spending ?? 0) }));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Company statistics")}</h1>
        <p className="text-muted-foreground text-sm">
          {stats?.period?.date_from ?? start} {t(locale, "to")} {stats?.period?.date_to ?? end}
          {scope ? ` · ${scope.map((building) => building.name || building.code).filter(Boolean).join(", ")}` : ""}
        </p>
      </div>
      <PeriodPicker path="/stats" period={{ start, end }} today={today} locale={locale} />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Developers", people?.developers?.total ?? 0, "Not terminated"],
          ["Inside now", people?.inside_now?.total ?? 0, "Present right now"],
          ["Money held", money?.developer_accounts?.total_balance ?? "0.00", "Developer balances"],
          ["Spending", money?.spending?.total ?? "0.00", "Till sales and bookings"],
        ].map(([label, value, hint]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardDescription>{t(locale, String(label))}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{typeof value === "number" ? value.toLocaleString("en-US") : value}</CardTitle>
              <p className="text-muted-foreground text-sm">{t(locale, String(hint))}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Attendance")}</CardTitle>
            <CardDescription>{t(locale, "People present each day.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart data={attendance} series={[{ key: "present", label: t(locale, "People"), color: "var(--chart-1)" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Money")}</CardTitle>
            <CardDescription>{t(locale, "Deposits and spending each day.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart
              data={cash}
              series={[
                { key: "deposits", label: t(locale, "Deposits"), color: "var(--chart-3)" },
                { key: "spending", label: t(locale, "Spending"), color: "var(--chart-1)" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
      {money?.store_sales ? (
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Store sales")}</CardTitle>
            <CardDescription>
              {t(locale, "Till sales")} {money.store_sales.sales_count ?? 0} · {money.store_sales.sales_total ?? "0.00"}
              {" · "}
              {t(locale, "Court bookings")} {money.store_sales.bookings_count ?? 0} · {money.store_sales.bookings_total ?? "0.00"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
