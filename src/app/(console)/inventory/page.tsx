import type { components } from "@/api/schema";
import { addStock } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";
import { RecordList } from "@/components/record-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { stockGoodChoices } from "@/lib/choices";
import { can, getSession, runsStore } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Movement = components["schemas"]["InventoryMovement"];

export default async function InventoryPage() {
  const session = await getSession();
  const stockStaff = session ? can(session.user, "good.stock") || (await runsStore()) : false;
  const [data, goods] = await Promise.all([
    loadList<Movement>("/api/v1/inventory/movements/?ordering=-created_at"),
    stockStaff && session ? stockGoodChoices(session.token) : Promise.resolve([]),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {stockStaff ? (
        <Card>
          <CardHeader>
            <CardTitle>Add stock</CardTitle>
            <CardDescription>
              Restock adds the quantity. Damage / loss subtracts it (give a reason). Stock count sets the
              quantity you counted. Only goods with stock tracking are listed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goods.length === 0 ? (
              <p className="text-muted-foreground text-sm">No goods with stock tracking.</p>
            ) : (
              <FieldForm
                action={addStock}
                submitLabel="Record stock change"
                fields={[
                  { name: "good", label: "Good", type: "select", required: true, options: goods },
                  {
                    name: "kind",
                    label: "Kind",
                    type: "select",
                    required: true,
                    defaultValue: "RESTOCK",
                    options: [
                      { value: "RESTOCK", label: "Restock (add)" },
                      { value: "DAMAGE", label: "Damage / loss (subtract)" },
                      { value: "ADJUSTMENT", label: "Stock count (set to counted)" },
                    ],
                  },
                  { name: "quantity", label: "Quantity (counted quantity for a stock count)", type: "number", required: true },
                  { name: "reason", label: "Reason", placeholder: "e.g. Delivery 2026-10-04, or Broken" },
                ]}
              />
            )}
          </CardContent>
        </Card>
      ) : null}
      <RecordList
        title="Inventory"
        summary={`${data.count.toLocaleString()} movements`}
        description="Stock changes recorded against goods."
        error={data.error}
        empty="No movements yet."
        headers={["When", "Good", "Kind", "Change", "After", "Reason"]}
        hrefs={data.results.map((row) => `/inventory/${row.id}`)}
        rows={data.results.map((row) => [
          showTime(row.created_at),
          row.good_name,
          row.kind,
          String(row.quantity_delta),
          String(row.quantity_after),
          show(row.reason),
        ])}
      />
    </div>
  );
}
