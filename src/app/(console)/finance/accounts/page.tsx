import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Account = components["schemas"]["DeveloperAccount"];

export default async function FinanceAccountsPage() {
  const data = await loadList<Account>("/api/v1/finance/accounts/?ordering=developer");
  return (
    <RecordList
      title="Wallets"
      summary={`${data.count.toLocaleString()} accounts`}
      description="Developer balances. Frozen accounts can still receive deposits."
      error={data.error}
      empty="No wallets yet."
      headers={["Person", "Balance", "Currency", "Status", "PIN", "Reason"]}
      hrefs={data.results.map((account) => `/finance/accounts/${account.id}`)}
      rows={data.results.map((account) => [
        show(account.developer?.full_name),
        account.balance,
        account.currency,
        account.status,
        account.has_pin ? "Set" : "Missing",
        show(account.status_reason),
      ])}
    />
  );
}
