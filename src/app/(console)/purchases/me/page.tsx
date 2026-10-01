import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Purchase = components["schemas"]["Purchase"];

export default async function MyPurchasesPage() {
  const data = await loadList<Purchase>("/api/v1/purchases/me/");
  return (
    <RecordList
      title="My purchases"
      summary={`${data.count.toLocaleString()} purchases`}
      description="Purchases charged to the signed-in developer."
      error={data.error}
      empty="No purchases for this account."
      headers={["When", "Status", "Seller", "Total"]}
      hrefs={data.results.map((row) => `/purchases/${row.id}`)}
      rows={data.results.map((row) => [showTime(row.created_at), row.status, show(row.seller?.name), `${row.total} ${row.currency}`])}
    />
  );
}
