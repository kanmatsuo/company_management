import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Account = components["schemas"]["SellerAccount"];

export default async function SellerAccountsPage() {
  const data = await loadList<Account>("/api/v1/seller-finance/accounts/");
  return (
    <RecordList
      title="Seller balances"
      summary={`${data.count.toLocaleString()} accounts`}
      description="Available balance is the balance minus money reserved by open payouts."
      error={data.error}
      empty="No seller accounts yet."
      headers={["Seller", "Balance", "Reserved", "Available", "Currency"]}
      hrefs={data.results.map((row) => `/seller-finance/accounts/${row.id}`)}
      rows={data.results.map((row) => [show(row.seller?.name), row.balance, row.reserved, row.available_balance, row.currency])}
    />
  );
}
