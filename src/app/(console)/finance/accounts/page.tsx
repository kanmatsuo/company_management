import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";
import { codeLabel } from "@/lib/codes";

type Account = components["schemas"]["DeveloperAccount"];

export default async function FinanceAccountsPage() {
  const locale = await getLocale();
  const data = await loadList<Account>("/api/v1/finance/accounts/?ordering=developer");
  return (
    <RecordList
      title="Wallets"
      summary={`${data.count.toLocaleString()} ${t(locale, "accounts")}`}
      description="Developer balances. Frozen accounts can still receive deposits."
      error={data.error}
      empty="No wallets yet."
      headers={["Person", "Balance", "Currency", "Status", "PIN", "Reason"]}
      hrefs={data.results.map((account) => `/finance/accounts/${account.id}`)}
      rows={data.results.map((account) => [
        show(account.developer?.full_name),
        account.balance,
        account.currency,
        codeLabel(locale, account.status),
        account.has_pin ? "Set" : "Missing",
        show(account.status_reason),
      ])}
    />
  );
}
