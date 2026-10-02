import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession, runsStore } from "@/lib/current-user";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Good = components["schemas"]["Good"];

export default async function GoodsPage() {
  const session = await getSession();
  const manage = session ? canManage(session.user, ["goods", "good", "seller"]) || await runsStore() : false;
  const data = await loadList<Good>("/api/v1/goods/?ordering=name");
  return (
    <RecordList
      title="Goods"
      summary={`${data.count.toLocaleString()} goods`}
      description="Items sold at a service position. Delete is a soft delete."
      error={data.error}
      empty="No goods yet."
      extra={manage ? <Button asChild><Link href="/goods/new">New good</Link></Button> : null}
      headers={["Name", "Kind", "Price", "Stock", "Seller", "Position", "Active"]}
      hrefs={data.results.map((good) => `/goods/${good.id}`)}
      rows={data.results.map((good) => [
        good.name,
        good.kind,
        `${good.price} ${good.currency}`,
        good.track_stock ? String(good.quantity) : "—",
        show(good.seller?.name),
        show(good.position_detail?.name),
        good.is_active ? "Yes" : "No",
      ])}
    />
  );
}
