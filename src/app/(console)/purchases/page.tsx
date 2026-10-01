import Link from "next/link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Purchase = components["schemas"]["Purchase"];

export default async function PurchasesPage() {
  const session = await getSession();
  const manage = session ? canManage(session.user, ["purchase", "seller"]) : false;
  const data = await loadList<Purchase>("/api/v1/purchases/?ordering=-created_at");
  return (
    <RecordList
      title="Purchases"
      summary={`${data.count.toLocaleString()} purchases`}
      description="Drafts are built at the till, then confirmed with a card and PIN."
      error={data.error}
      empty="No purchases yet."
      extra={manage ? <Button asChild><Link href="/purchases/new">New purchase</Link></Button> : null}
      headers={["When", "Status", "Buyer", "Seller", "Position", "Total"]}
      hrefs={data.results.map((row) => `/purchases/${row.id}`)}
      rows={data.results.map((row) => [
        showTime(row.created_at),
        row.status,
        show(row.developer?.full_name),
        show(row.seller?.name),
        show(row.service_position_name),
        `${row.total} ${row.currency}`,
      ])}
    />
  );
}
