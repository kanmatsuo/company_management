import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { codeLabel } from "@/lib/codes";

type Assignment = components["schemas"]["RFIDCardAssignment"];

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/assignments");
  const loaded = await loadOne<Assignment>(`/api/v1/rfid/assignments/${id}/`);
  if (!loaded.value) return <LoadError title="Assignment" message={loaded.error ?? "Not found."} />;
  const row = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{row.card_uid}</h1>
        <p className="text-muted-foreground text-sm">{show(row.developer?.full_name)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Card", value: row.card_uid },
              { label: "Assigned", value: showTime(row.assigned_at) },
              { label: "Assigned by", value: row.assigned_by ? String(row.assigned_by) : "—" },
              { label: "Returned", value: showTime(row.unassigned_at) },
              { label: "Returned by", value: row.unassigned_by ? String(row.unassigned_by) : "—" },
              { label: "End reason", value: codeLabel(locale, row.end_reason) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
