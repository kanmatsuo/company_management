import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { t } from "@/lib/i18n";
import { show, showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";
import { codeLabel } from "@/lib/codes";

type Assignment = components["schemas"]["RFIDCardAssignment"];

export default async function AssignmentsPage() {
  const locale = await getLocale();
  const data = await loadList<Assignment>("/api/v1/rfid/assignments/?ordering=-assigned_at");
  return (
    <RecordList
      title="Assignments"
      summary={`${data.count.toLocaleString()} ${t(locale, "assignments")}`}
      description="Who held which card, including returned and replaced cards."
      error={data.error}
      empty="No assignments yet."
      headers={["Card", "Person", "Assigned", "Returned", "Reason"]}
      hrefs={data.results.map((row) => `/assignments/${row.id}`)}
      rows={data.results.map((row) => [
        row.card_uid,
        show(row.developer?.full_name),
        showTime(row.assigned_at),
        showTime(row.unassigned_at),
        codeLabel(locale, row.end_reason),
      ])}
    />
  );
}
