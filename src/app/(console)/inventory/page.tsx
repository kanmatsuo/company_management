import { AlertTriangle, Boxes, PackageCheck, PackageX } from "lucide-react";
import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { addStock } from "@/app/(console)/mutations";
import { DataTable } from "@/components/data-table";
import { FieldForm } from "@/components/field-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, getSession, runsStore } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Movement = components["schemas"]["InventoryMovement"];
type Good = components["schemas"]["Good"];

/** At or below this many left, a good counts as low on stock. */
const LOW = 5;

const KINDS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "SALE", label: "Sales" },
  { value: "RESTOCK", label: "Restock" },
  { value: "DAMAGE", label: "Damage / loss" },
  { value: "ADJUSTMENT", label: "Stock count" },
  { value: "INITIAL_STOCK", label: "Initial stock" },
];

const KIND_LABEL: Record<string, string> = {
  SALE: "Sale",
  RESTOCK: "Restock",
  DAMAGE: "Damage / loss",
  ADJUSTMENT: "Stock count",
  INITIAL_STOCK: "Initial stock",
  RETURN: "Return",
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const query = await searchParams;
  const kind = KINDS.some((option) => option.value === one(query.kind)) ? (one(query.kind) ?? "") : "";
  const session = await getSession();
  const locale = await getLocale();
  const stockStaff = session ? can(session.user, "good.stock") || (await runsStore()) : false;
  const [data, goods] = await Promise.all([
    loadList<Movement>(listPath("/api/v1/inventory/movements/?ordering=-created_at", { kind })),
    loadList<Good>("/api/v1/goods/?track_stock=true&is_active=true&rental=false&ordering=quantity"),
  ]);
  const tracked = goods.results;
  const units = tracked.reduce((sum, good) => sum + (good.quantity ?? 0), 0);
  const out = tracked.filter((good) => (good.quantity ?? 0) === 0);
  const low = tracked.filter((good) => (good.quantity ?? 0) > 0 && (good.quantity ?? 0) <= LOW);
  const watch = [...out, ...low];
  const options = [...tracked]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((good) => ({
      value: String(good.id),
      label: `${good.name}${good.position_detail?.name ? ` · ${good.position_detail.name}` : ""} · ${good.quantity ?? 0} ${t(locale, "in stock")}`,
    }));
  const tiles = [
    { label: "Tracked goods", value: tracked.length, icon: Boxes, tone: "bg-primary/10 text-primary" },
    { label: "Units in stock", value: units, icon: PackageCheck, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    { label: "Low stock", value: low.length, icon: AlertTriangle, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { label: "Out of stock", value: out.length, icon: PackageX, tone: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Inventory")}</h1>
        <p className="text-muted-foreground text-sm">{t(locale, "Stock levels now and every stock change.")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="py-4">
            <CardContent className="flex items-start justify-between gap-3 px-4">
              <div>
                <p className="text-muted-foreground text-xs">{t(locale, tile.label)}</p>
                <p className="font-semibold text-2xl tabular-nums tracking-tight">{tile.value.toLocaleString("en-US")}</p>
              </div>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tile.tone}`}>
                <tile.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle>{t(locale, "Movements")}</CardTitle>
            <CardDescription>
              {data.count.toLocaleString("en-US")} {t(locale, "stock changes, newest first.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {KINDS.map((option) => (
                <Link
                  key={option.value || "all"}
                  href={option.value ? `/inventory?kind=${option.value}` : "/inventory"}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${kind === option.value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50 hover:bg-muted"}`}
                >
                  {t(locale, option.label)}
                </Link>
              ))}
            </div>
            {data.error ? (
              <p className="text-destructive text-sm">{data.error}</p>
            ) : data.results.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t(locale, "No movements yet.")}</p>
            ) : (
              <DataTable
                locale={locale}
                headers={["When", "Good", "Kind", "Change", "After", "Reason"]}
                hrefs={data.results.map((row) => `/inventory/${row.id}`)}
                rows={data.results.map((row) => [
                  showTime(row.created_at),
                  row.good_name,
                  t(locale, KIND_LABEL[row.kind] ?? row.kind),
                  row.quantity_delta > 0 ? `+${row.quantity_delta}` : String(row.quantity_delta),
                  String(row.quantity_after),
                  show(row.reason),
                ])}
              />
            )}
          </CardContent>
        </Card>

        <div className="order-1 grid gap-4 lg:order-2">
          {stockStaff ? (
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Add stock")}</CardTitle>
                <CardDescription>
                  {t(locale, "Restock adds. Damage / loss subtracts (give a reason). Stock count sets what you counted.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {options.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t(locale, "No goods with stock tracking.")}</p>
                ) : (
                  <FieldForm
                    action={addStock}
                    submitLabel="Record stock change"
                    columns={1}
                    fields={[
                      { name: "good", label: "Good", type: "select", required: true, options },
                      {
                        name: "kind",
                        label: "Kind",
                        type: "select",
                        required: true,
                        defaultValue: "RESTOCK",
                        options: [
                          { value: "RESTOCK", label: "Restock (add)" },
                          { value: "DAMAGE", label: "Damage / loss (subtract)" },
                          { value: "ADJUSTMENT", label: "Stock count (set to counted)" },
                        ],
                      },
                      { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "For a stock count: the counted quantity" },
                      { name: "reason", label: "Reason", placeholder: "e.g. Delivery 2026-10-04, or Broken" },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "Needs restock")}</CardTitle>
              <CardDescription>{t(locale, "Out of stock, or {n} or fewer left.").replace("{n}", String(LOW))}</CardDescription>
            </CardHeader>
            <CardContent>
              {watch.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t(locale, "Every tracked good has enough stock.")}</p>
              ) : (
                <ul className="grid divide-y">
                  {watch.map((good) => {
                    const empty = (good.quantity ?? 0) === 0;
                    return (
                      <li key={good.id} className="flex items-center justify-between gap-3 py-2">
                        <Link href={`/goods/${good.id}`} className="min-w-0 hover:underline">
                          <p className="truncate font-medium text-sm">{good.name}</p>
                          <p className="truncate text-muted-foreground text-xs">{show(good.seller?.name)}</p>
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-xs tabular-nums ${empty ? "bg-destructive/10 text-destructive" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}
                        >
                          {empty ? t(locale, "Out") : `${good.quantity} ${t(locale, "left")}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
