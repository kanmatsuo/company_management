import Link from "next/link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Payout = components["schemas"]["SellerPayment"];

export default async function PayoutsPage() {
  const data = await loadList<Payout>("/api/v1/seller-finance/payouts/?ordering=-created_at");
  return (
    <RecordList
      title="Payouts"
      summary={`${data.count.toLocaleString()} payouts`}
      description="Requested, approved, paid, rejected, or cancelled."
      error={data.error}
      empty="No payouts yet."
      extra={(
        <div className="flex gap-2">
          <Button asChild><Link href="/seller-finance/payouts/new">Request payout</Link></Button>
          <Button asChild variant="outline"><Link href="/seller-finance/adjustments">Adjust</Link></Button>
        </div>
      )}
      headers={["When", "Seller", "Amount", "Status", "Reference"]}
      hrefs={data.results.map((row) => `/seller-finance/payouts/${row.id}`)}
      rows={data.results.map((row) => [showTime(row.created_at), show(row.seller?.name), `${row.amount} ${row.currency}`, row.status, show(row.payment_reference)])}
    />
  );
}
