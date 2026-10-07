import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { show, showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Row = components["schemas"]["AccountTransaction"];

export default async function TransactionsPage() {
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? canManage(session.user, ["finance"]) : false;
  const data = await loadList<Row>("/api/v1/finance/transactions/?ordering=-created_at");
  return (
    <RecordList
      title="Wallet transactions"
      summary={`${data.count.toLocaleString()} ${t(locale, "transactions")}`}
      description="Deposits, purchases, refunds, and adjustments."
      error={data.error}
      empty="No transactions yet."
      extra={manage ? (
        <div className="flex gap-2">
          <Button asChild><Link href="/finance/deposits">{t(locale, "Deposit")}</Link></Button>
          <Button asChild variant="outline"><Link href="/finance/adjustments">{t(locale, "Adjust")}</Link></Button>
        </div>
      ) : null}
      headers={["When", "Person", "Kind", "Amount", "Balance", "Description"]}
      hrefs={data.results.map((row) => `/finance/transactions/${row.id}`)}
      rows={data.results.map((row) => [
        showTime(row.created_at),
        show(row.developer?.full_name),
        row.kind,
        row.amount,
        row.balance_after,
        show(row.description),
      ])}
    />
  );
}
