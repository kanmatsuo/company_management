import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Row = components["schemas"]["SellerTransaction"];

export default async function SellerTransactionsPage() {
  const data = await loadList<Row>("/api/v1/seller-finance/transactions/?ordering=-created_at");
  return (
    <RecordList
      title="Seller transactions"
      summary={`${data.count.toLocaleString()} transactions`}
      description="Sales, payouts, and signed adjustments."
      error={data.error}
      empty="No seller transactions yet."
      headers={["When", "Seller", "Kind", "Amount", "Balance", "Description"]}
      hrefs={data.results.map((row) => `/seller-finance/transactions/${row.id}`)}
      rows={data.results.map((row) => [showTime(row.created_at), show(row.seller?.name), row.kind, row.amount, row.balance_after, show(row.description)])}
    />
  );
}
