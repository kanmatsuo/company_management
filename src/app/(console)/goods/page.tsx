import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession, runsStore } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Good = components["schemas"]["Good"];

export default async function GoodsPage() {
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? canManage(session.user, ["goods", "good", "seller"]) || await runsStore() : false;
  const data = await loadList<Good>("/api/v1/goods/?ordering=name&rental=false");
  return (
    <RecordList
      title="Goods"
      summary={`${data.count.toLocaleString()} ${t(locale, "goods")}`}
      description="Products and services sold at a counter. Courts are under Playground. Delete is a soft delete."
      error={data.error}
      empty="No goods yet."
      extra={manage ? <Button asChild><Link href="/goods/new">{t(locale, "New good")}</Link></Button> : null}
      headers={["Name", "Kind", "Price", "Stock", "Seller", "Counter", "Active"]}
      hrefs={data.results.map((good) => `/goods/${good.id}`)}
      rows={data.results.map((good) => [
        good.name,
        good.kind === "SERVICE" ? "Service" : "Product",
        `${good.price} ${good.currency}`,
        good.track_stock ? String(good.quantity) : "—",
        show(good.seller?.name),
        show(good.position_detail?.name),
        good.is_active ? "Yes" : "No",
      ])}
    />
  );
}
