import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { codeLabel } from "@/lib/codes";

type Movement = components["schemas"]["InventoryMovement"];

export default async function MovementPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/inventory");
  const loaded = await loadOne<Movement>(`/api/v1/inventory/movements/${id}/`);
  if (!loaded.value) return <LoadError title="Movement" message={loaded.error ?? "Not found."} />;
  const row = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{row.good_name}</h1>
        <p className="text-muted-foreground text-sm">{codeLabel(locale, row.kind)} · {showTime(row.created_at)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Good", value: row.good_name },
              { label: "Change", value: String(row.quantity_delta) },
              { label: "Quantity after", value: String(row.quantity_after) },
              { label: "Reason", value: show(row.reason) },
              { label: "Reference", value: show(row.reference) },
              { label: "Actor", value: row.actor ? String(row.actor) : "—" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
