import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Movement = components["schemas"]["InventoryMovement"];

export default async function InventoryPage() {
  const data = await loadList<Movement>("/api/v1/inventory/movements/?ordering=-created_at");
  return (
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
  );
}
