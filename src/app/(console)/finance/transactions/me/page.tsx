import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { t } from "@/lib/i18n";
import { show, showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Row = components["schemas"]["AccountTransaction"];

export default async function MyTransactionsPage() {
  const locale = await getLocale();
  const data = await loadList<Row>("/api/v1/finance/transactions/me/?ordering=-created_at");
  return (
    <RecordList
      title="My transactions"
      summary={`${data.count.toLocaleString()} ${t(locale, "transactions")}`}
      description="Movements on the signed-in developer's wallet."
      error={data.error}
      empty="No transactions for this account."
      headers={["When", "Kind", "Amount", "Balance", "Description"]}
      hrefs={data.results.map((row) => `/finance/transactions/${row.id}`)}
      rows={data.results.map((row) => [showTime(row.created_at), row.kind, row.amount, row.balance_after, show(row.description)])}
    />
  );
}
