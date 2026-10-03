import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { SeriesChart } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/period-picker";
import { RecordList } from "@/components/record-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManage, getSession, runsStore } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { daySpan, resolvePeriod, shift, startOfWeek, todayIso } from "@/lib/period";

type Purchase = components["schemas"]["Purchase"];
type PerformanceRow = {
  service_position: number;
  service_position_name: string;
  seller_name: string;
  building_name: string | null;
  sales_count: number;
  sales_total: string;
  bookings_count: number;
  bookings_total: string;
  total: string;
};






function cents(value: string | null | undefined) {
  if (!value) return 0;
  const [whole, fraction = "00"] = value.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  return sign * (Number(whole.replace("-", "")) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2)));
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
}

function dayKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const today = todayIso();
  const { start, end } = resolvePeriod(query, { start: today, end: today });
  const session = await getSession();
  const locale = await getLocale();
  let performance: PerformanceRow[] = [];
  let performanceError: string | null = null;
  if (session) {
    try {
      performance = await djangoFetch<PerformanceRow[]>(
        `/api/v1/purchases/performance/?confirmed_after=${start}T00:00:00Z&confirmed_before=${shift(end, 1)}T00:00:00Z`,
        { accessToken: session.token },
      );
    } catch (caught) {
      performanceError = caught instanceof DjangoError ? caught.message : "Could not load sales by counter.";
    }
  }
  const manage = session ? canManage(session.user, ["purchase", "seller"]) || await runsStore() : false;
  const data = await loadList<Purchase>("/api/v1/purchases/?ordering=-created_at");
  const inRange = data.results.filter((row) => {
    const day = dayKey(row.status === "CONFIRMED" ? row.confirmed_at || row.created_at : row.created_at);
    return day >= start && day <= end;
  });
  const paid = inRange.filter((row) => row.status === "CONFIRMED");
  const drafts = inRange.filter((row) => row.status === "DRAFT");
  const cancelled = inRange.filter((row) => row.status === "CANCELLED");
  const taken = paid.reduce((sum, row) => sum + cents(row.total), 0);
  const currency = paid[0]?.currency || inRange[0]?.currency || "";
  const buyers = new Set(paid.map((row) => row.developer?.id).filter((id): id is number => typeof id === "number"));

  const bySeller = new Map<string, { count: number; money: number }>();
  const byCounter = new Map<string, { count: number; money: number }>();
  const byReader = new Map<string, { count: number; money: number }>();
  for (const row of paid) {
    const seller = row.seller?.name || "No seller";
    const counter = row.service_position_name || "No counter";
    const reader = row.reader || "No reader";
    for (const [map, key] of [[bySeller, seller], [byCounter, counter], [byReader, reader]] as const) {
      const current = map.get(key) ?? { count: 0, money: 0 };
      current.count += 1;
      current.money += cents(row.total);
      map.set(key, current);
    }
  }
  const weekly = daySpan(start, end) > 31;
  const byPeriod = new Map<string, { count: number; money: number }>();
  for (const row of paid) {
    const day = dayKey(row.confirmed_at || row.created_at);
    const key = weekly ? startOfWeek(day) : day;
    const current = byPeriod.get(key) ?? { count: 0, money: 0 };
    current.count += 1;
    current.money += cents(row.total);
    byPeriod.set(key, current);
  }
  const sellerRows = [...bySeller.entries()].sort((left, right) => right[1].money - left[1].money);
  const counterRows = [...byCounter.entries()].sort((left, right) => right[1].money - left[1].money);
  const readerRows = [...byReader.entries()].sort((left, right) => right[1].money - left[1].money);
  const periodRows = [...byPeriod.entries()].sort(([left], [right]) => left.localeCompare(right));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Purchases")}</h1>
          <p className="text-muted-foreground text-sm">{start} {t(locale, "to")} {end}. {t(locale, "Paid sales are confirmed purchases. Money is the sum of those totals.")}</p>
        </div>
        {manage ? <Button asChild><Link href="/purchases/new">{t(locale, "New purchase")}</Link></Button> : null}
      </div>
      <PeriodPicker path="/purchases" period={{ start, end }} today={today} locale={locale} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Paid sales", paid.length, t(locale, "Confirmed purchases")],
          ["Money taken", `${money(taken)} ${currency}`.trim(), t(locale, "Sum of paid totals")],
          ["Buyers", buyers.size, t(locale, "Different people who paid")],
          ["Drafts", drafts.length, `${cancelled.length} ${t(locale, "cancelled")}`],
        ].map(([label, value, hint]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{t(locale, String(label))}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{typeof value === "number" ? value.toLocaleString("en-US") : value}</CardTitle>
              <p className="text-muted-foreground text-sm">{hint}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      {data.error ? <p className="text-destructive text-sm">{data.error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "By seller")}</CardTitle>
          <CardDescription>{t(locale, "Paid sales and money taken for each seller.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={sellerRows.map(([name, row]) => ({ name, sales: row.count, money: row.money / 100 }))}
            series={[
              { key: "sales", label: t(locale, "Paid sales"), color: "var(--chart-1)" },
              { key: "money", label: `${t(locale, "Money")} (${currency || t(locale, "total")})`, color: "var(--chart-3)" },
            ]}
            layout="vertical"
            height={Math.max(220, sellerRows.length * 56)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "By counter")}</CardTitle>
          <CardDescription>{t(locale, "Paid sales at each service position.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={counterRows.map(([name, row]) => ({ name, sales: row.count, money: row.money / 100 }))}
            series={[
              { key: "sales", label: t(locale, "Paid sales"), color: "var(--chart-1)" },
              { key: "money", label: `${t(locale, "Money")} (${currency || t(locale, "total")})`, color: "var(--chart-4)" },
            ]}
            height={Math.max(240, counterRows.length * 48)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "By till reader")}</CardTitle>
          <CardDescription>{t(locale, "Which reader was used for each paid sale.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={readerRows.map(([name, row]) => ({ name, sales: row.count }))}
            series={[{ key: "sales", label: t(locale, "Paid sales"), color: "var(--chart-5)" }]}
            layout="vertical"
            height={Math.max(200, readerRows.length * 48)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{weekly ? t(locale, "By week") : t(locale, "By day")}</CardTitle>
          <CardDescription>{weekly ? t(locale, "Paid sales in each week of this range.") : t(locale, "Paid sales in each day of this range.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={periodRows.map(([period, row]) => ({ name: period.slice(5), sales: row.count, money: row.money / 100 }))}
            series={[
              { key: "sales", label: t(locale, "Paid sales"), color: "var(--chart-1)" },
              { key: "money", label: `${t(locale, "Money")} (${currency || t(locale, "total")})`, color: "var(--chart-3)" },
            ]}
            height={280}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Sales by counter")}</CardTitle>
          <CardDescription>{t(locale, "Confirmed till sales and court bookings for each sell position.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceError ? <p className="text-destructive text-sm">{performanceError}</p> : performance.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No confirmed sales in this range.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "Position")}</TableHead>
                  <TableHead>{t(locale, "Seller")}</TableHead>
                  <TableHead>{t(locale, "Place")}</TableHead>
                  <TableHead>{t(locale, "Till sales")}</TableHead>
                  <TableHead>{t(locale, "Court bookings")}</TableHead>
                  <TableHead>{t(locale, "Total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.map((row) => (
                  <TableRow key={row.service_position}>
                    <TableCell>{row.service_position_name}</TableCell>
                    <TableCell>{row.seller_name}</TableCell>
                    <TableCell>{row.building_name || "—"}</TableCell>
                    <TableCell>{row.sales_count} · {row.sales_total}</TableCell>
                    <TableCell>{row.bookings_count} · {row.bookings_total}</TableCell>
                    <TableCell>{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <RecordList
        title="Sales in this range"
        summary={`${inRange.length.toLocaleString()} ${t(locale, "purchases")}`}
        description="Includes drafts and cancelled purchases from the same dates."
        error={data.error}
        empty="No purchases in this range."
        headers={["When", "Status", "Buyer", "Seller", "Position", "Reader", "Total"]}
        hrefs={inRange.map((row) => `/purchases/${row.id}`)}
        rows={inRange.map((row) => [
          showTime(row.status === "CONFIRMED" ? row.confirmed_at || row.created_at : row.created_at),
          row.status,
          show(row.developer?.full_name),
          show(row.seller?.name),
          show(row.service_position_name),
          show(row.reader),
          `${row.total} ${row.currency}`,
        ])}
      />
    </div>
  );
}
