import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Row = components["schemas"]["SellerTransaction"];

export default async function SellerTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/seller-finance/transactions");
  const loaded = await loadOne<Row>(`/api/v1/seller-finance/transactions/${id}/`);
  if (!loaded.value) return <LoadError title="Seller transaction" message={loaded.error ?? "Not found."} />;
  const row = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{row.kind}</h1>
        <p className="text-muted-foreground text-sm">{row.amount} · {showTime(row.created_at)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{show(row.seller?.name)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Account", value: String(row.account) },
              { label: "Balance after", value: row.balance_after },
              { label: "Description", value: show(row.description) },
              { label: "Reference", value: show(row.reference) },
              { label: "Actor", value: row.actor ? String(row.actor) : "—" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
