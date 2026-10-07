import { Coins, Package, Plus, ReceiptText } from "lucide-react";
import { DeleteForGood } from "@/components/delete-for-good";
import Link from "@/components/app-link";
import { redirect } from "next/navigation";
import { deletePosition, updatePosition } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage, runsStore } from "@/lib/current-user";
import { djangoFetch } from "@/lib/django";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadOne } from "@/lib/page-data";
import { shift, todayIso } from "@/lib/period";
import { buildingChoices, sellerUserChoices } from "@/lib/choices";

type Position = components["schemas"]["ServicePosition"] & {
  building?: number | null;
  building_name?: string | null;
  manager?: number | null;
  manager_username?: string | null;
};
type Good = components["schemas"]["Good"];
type Performance = { sales_count: number; bookings_count: number; total: string };

const KIND: Record<string, string> = { PRODUCT: "Product", SERVICE: "Service", RENTAL: "Court" };

export default async function PositionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/positions");
  const loaded = await loadOne<Position>(`/api/v1/service-positions/${id}/`);
  if (!loaded.value) return <LoadError title="Counter" message={loaded.error ?? "Not found."} />;
  const position = loaded.value;
  const { user, token } = loaded.session;
  const locale = await getLocale();
  const manage = can(user, "counter.manage") || (await runsStore());
  const addGoods = canManage(user, ["goods", "good", "seller"]) || (await runsStore());
  const today = todayIso();
  const since = shift(today, -29);
  const [buildings, users, goods, performance] = await Promise.all([
    manage ? buildingChoices(token) : Promise.resolve([]),
    manage ? sellerUserChoices(token) : Promise.resolve([]),
    djangoFetch<{ results: Good[] }>(`/api/v1/goods/?service_position=${id}&ordering=name&page_size=500`, { accessToken: token })
      .then((page) => page.results)
      .catch(() => [] as Good[]),
    djangoFetch<Performance[]>(
      `/api/v1/purchases/performance/?service_position=${id}&confirmed_after=${since}T00:00:00Z&confirmed_before=${shift(today, 1)}T00:00:00Z`,
      { accessToken: token },
    )
      .then((rows) => rows[0] ?? null)
      .catch(() => null),
  ]);
  const currency = goods[0]?.currency ?? "";
  const tiles = [
    { label: "Goods", value: goods.length.toLocaleString("en-US"), hint: `${goods.filter((good) => good.is_active).length} ${t(locale, "on sale")}`, icon: Package, tone: "bg-primary/10 text-primary" },
    {
      label: "Paid sales",
      value: ((performance?.sales_count ?? 0) + (performance?.bookings_count ?? 0)).toLocaleString("en-US"),
      hint: t(locale, "Last 30 days"),
      icon: ReceiptText,
      tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
    {
      label: "Money taken",
      value: `${Number(performance?.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`.trim(),
      hint: t(locale, "Last 30 days"),
      icon: Coins,
      tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{position.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <Badge variant={position.is_active ? "secondary" : "outline"}>{t(locale, position.is_active ? "Active" : "Inactive")}</Badge>
            {position.seller ? (
              <Link href={`/sellers/${position.seller}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                {show(position.seller_detail?.name)}
              </Link>
            ) : null}
            {position.building_name ? <span>· {position.building_name}</span> : null}
            {position.location ? <span>· {position.location}</span> : null}
          </div>
        </div>
        {addGoods ? (
          <Button asChild>
            <Link href={`/goods/new?position=${position.id}`}>
              <Plus />
              {t(locale, "Add good")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              {t(locale, "A counter stays with its store. The building decides which building managers see its sales.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {manage ? (
              <FieldForm
                action={updatePosition.bind(null, position.id)}
                submitLabel="Save"
                fields={[
                  { name: "name", label: "Name", defaultValue: position.name, required: true },
                  { name: "location", label: "Location", defaultValue: position.location ?? "", placeholder: "e.g. Lobby, 3rd floor" },
                  { name: "building", label: "Building", type: "select", options: [{ value: "", label: "No building" }, ...buildings], defaultValue: position.building ? String(position.building) : "" },
                  { name: "manager", label: "Counter manager (SELLER role)", type: "select", options: [{ value: "", label: "No manager" }, ...users], defaultValue: position.manager ? String(position.manager) : "" },
                  { name: "is_active", label: "Active", type: "checkbox", defaultValue: position.is_active ? "on" : "" },
                ]}
              />
            ) : (
              <Facts
                items={[
                  { label: "Location", value: show(position.location) },
                  { label: "Building", value: show(position.building_name) },
                  { label: "Counter manager", value: show(position.manager_username) },
                  { label: "Active", value: position.is_active ? "Yes" : "No" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Goods at this counter")}</CardTitle>
            <CardDescription>{t(locale, "Open a good to change its price or stock.")}</CardDescription>
          </CardHeader>
          <CardContent>
            {goods.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t(locale, "No goods yet. Add the first one.")}</p>
            ) : (
              <ul className="grid max-h-[28rem] divide-y overflow-y-auto">
                {goods.map((good) => {
                  const href = good.kind === "RENTAL" ? `/rentals/${good.id}` : `/goods/${good.id}`;
                  const low = good.track_stock && (good.quantity ?? 0) <= 5;
                  return (
                    <li key={good.id}>
                      <Link href={href} className="flex items-center justify-between gap-3 rounded-md px-1 py-2 hover:bg-muted/50">
                        <span className="min-w-0">
                          <span className={`block truncate font-medium text-sm ${good.is_active ? "" : "text-muted-foreground line-through"}`}>{good.name}</span>
                          <span className="text-muted-foreground text-xs">{t(locale, KIND[good.kind ?? "PRODUCT"] ?? String(good.kind))}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-medium text-sm tabular-nums">
                            {good.price} <span className="font-normal text-muted-foreground text-xs">{good.currency}</span>
                          </span>
                          <span className={`text-xs tabular-nums ${low ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                            {good.track_stock ? `${good.quantity ?? 0} ${t(locale, "in stock")}` : t(locale, "No stock tracking")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {manage || can(user, "system.delete_records") ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {manage ? (
            <Card>
              <CardHeader>
                <CardTitle>Remove</CardTitle>
                <CardDescription>Hides this counter (soft delete). Its sales history stays.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={deletePosition.bind(null, position.id)} submitLabel="Delete counter" variant="destructive" fields={[]} />
              </CardContent>
            </Card>
          ) : null}
          {can(user, "system.delete_records") ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle>Delete for good</CardTitle>
                <CardDescription>Deletes the counter with its goods, stock history, purchases and bookings.</CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteForGood kind="position" id={position.id} redirectTo="/positions" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
