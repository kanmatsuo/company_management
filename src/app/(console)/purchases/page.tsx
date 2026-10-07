import { Coins, Download, FilePen, ReceiptText, Users } from "lucide-react";
import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { SeriesChart } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/period-picker";
import { DataTable } from "@/components/data-table";
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
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
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
  const byReader = new Map<string, { count: number; money: number }>();
  for (const row of paid) {
    const seller = row.seller?.name || "No seller";
    const reader = row.reader || "No reader";
    for (const [map, key] of [[bySeller, seller], [byReader, reader]] as const) {
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
  const readerRows = [...byReader.entries()].sort((left, right) => right[1].money - left[1].money);
  const periodRows = [...byPeriod.entries()].sort(([left], [right]) => left.localeCompare(right));

  const STATUS_LABEL: Record<string, string> = { CONFIRMED: "Paid", DRAFT: "Draft", CANCELLED: "Cancelled" };
  const status = ["CONFIRMED", "DRAFT", "CANCELLED"].includes(query.status ?? "") ? query.status! : "";
  const listed = status ? inRange.filter((row) => row.status === status) : inRange;
  const statusHref = (value: string) =>
    `/purchases?${new URLSearchParams({ from: start, to: end, ...(value ? { status: value } : {}) })}`;
  const tiles = [
    { label: "Paid sales", value: paid.length.toLocaleString("en-US"), hint: t(locale, "Confirmed purchases"), icon: ReceiptText, tone: "bg-primary/10 text-primary" },
    { label: "Money taken", value: `${money(taken)} ${currency}`.trim(), hint: t(locale, "Sum of paid totals"), icon: Coins, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { label: "Buyers", value: buyers.size.toLocaleString("en-US"), hint: t(locale, "Different people who paid"), icon: Users, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
    { label: "Drafts", value: drafts.length.toLocaleString("en-US"), hint: `${cancelled.length} ${t(locale, "cancelled")}`, icon: FilePen, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Purchases")}</h1>
          <p className="text-muted-foreground text-sm">{start === end ? start : `${start} ${t(locale, "to")} ${end}`} · {t(locale, "Paid sales are confirmed purchases.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/api/excel/purchases?${new URLSearchParams({ date_from: start, date_to: end, ...(status ? { status } : {}) })}`} download>
              <Download />
              {t(locale, "Download Excel")}
            </a>
          </Button>
          {manage ? <Button asChild><Link href="/purchases/new">{t(locale, "New purchase")}</Link></Button> : null}
        </div>
      </div>
      <Card>
        <CardContent>
          <PeriodPicker path="/purchases" period={{ start, end }} today={today} locale={locale} keep={{ status: status || undefined }} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="py-4">
            <CardContent className="flex items-start justify-between gap-3 px-4">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">{t(locale, tile.label)}</p>
                <p className="truncate font-semibold text-2xl tabular-nums tracking-tight">{tile.value}</p>
                <p className="mt-1 text-muted-foreground text-xs">{tile.hint}</p>
              </div>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tile.tone}`}>
                <tile.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      {data.error ? <p className="text-destructive text-sm">{data.error}</p> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
            <CardTitle>{t(locale, "Top sellers")}</CardTitle>
            <CardDescription>{t(locale, "Money taken by each seller in this range.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Ranking rows={sellerRows} currency={currency} empty={t(locale, "No paid sales in this range.")} sales={t(locale, "sales")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Sales by counter")}</CardTitle>
            <CardDescription>{t(locale, "Confirmed till sales and court bookings at each counter.")}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {performanceError ? <p className="text-destructive text-sm">{performanceError}</p> : performance.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t(locale, "No confirmed sales in this range.")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(locale, "Counter")}</TableHead>
                    <TableHead>{t(locale, "Seller")}</TableHead>
                    <TableHead className="text-right">{t(locale, "Till sales")}</TableHead>
                    <TableHead className="text-right">{t(locale, "Court bookings")}</TableHead>
                    <TableHead className="text-right">{t(locale, "Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((row) => (
                    <TableRow key={row.service_position}>
                      <TableCell className="font-medium">
                        {row.service_position_name}
                        {row.building_name ? <span className="block text-muted-foreground text-xs">{row.building_name}</span> : null}
                      </TableCell>
                      <TableCell>{row.seller_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.sales_total} <span className="text-muted-foreground">({row.sales_count})</span></TableCell>
                      <TableCell className="text-right tabular-nums">{row.bookings_total} <span className="text-muted-foreground">({row.bookings_count})</span></TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "By till reader")}</CardTitle>
            <CardDescription>{t(locale, "Which reader was used for each paid sale.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Ranking rows={readerRows} currency={currency} empty={t(locale, "No paid sales in this range.")} sales={t(locale, "sales")} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Purchases in this range")}</CardTitle>
          <CardDescription>{listed.length.toLocaleString("en-US")} {t(locale, "purchases")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["", "All", inRange.length],
              ["CONFIRMED", "Paid", paid.length],
              ["DRAFT", "Drafts", drafts.length],
              ["CANCELLED", "Cancelled", cancelled.length],
            ].map(([value, label, count]) => (
              <Link
                key={String(value) || "all"}
                href={statusHref(String(value))}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${status === value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50 hover:bg-muted"}`}
              >
                {t(locale, String(label))} <span className="tabular-nums opacity-70">{count}</span>
              </Link>
            ))}
          </div>
          {listed.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No purchases in this range.")}</p>
          ) : (
            <DataTable
              locale={locale}
              headers={["When", "Status", "Buyer", "Seller", "Counter", "Reader", "Total"]}
              hrefs={listed.map((row) => `/purchases/${row.id}`)}
              rows={listed.map((row) => [
                showTime(row.status === "CONFIRMED" ? row.confirmed_at || row.created_at : row.created_at),
                STATUS_LABEL[row.status] ?? row.status,
                show(row.developer?.full_name),
                show(row.seller?.name),
                show(row.service_position_name),
                show(row.reader),
                `${row.total} ${row.currency}`,
              ])}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** A ranked list with a bar for each row's share of the top one. */
function Ranking({
  rows,
  currency,
  empty,
  sales,
}: {
  rows: [string, { count: number; money: number }][];
  currency: string;
  empty: string;
  sales: string;
}) {
  if (rows.length === 0) return <p className="text-muted-foreground text-sm">{empty}</p>;
  const top = Math.max(...rows.map(([, row]) => row.money), 1);
  return (
    <ol className="grid gap-3">
      {rows.slice(0, 8).map(([name, row], index) => (
        <li key={name} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-muted-foreground text-xs tabular-nums">{index + 1}</span>
              <span className="truncate font-medium">{name}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{money(row.money)}</span> <span className="text-muted-foreground text-xs">{currency} · {row.count} {sales}</span>
            </span>
          </div>
          <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400" style={{ width: `${(row.money / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
