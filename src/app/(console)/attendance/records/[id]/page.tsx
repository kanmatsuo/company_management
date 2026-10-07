import { redirect } from "next/navigation";
import { voidAttendance } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { codeLabel } from "@/lib/codes";
import { t } from "@/lib/i18n";

type Record = components["schemas"]["AttendanceRecord"];

export default async function AttendanceRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/attendance/records");
  const loaded = await loadOne<Record>(`/api/v1/attendance/records/${id}/`);
  if (!loaded.value) return <LoadError title="Attendance record" message={loaded.error ?? "Not found."} />;
  const record = loaded.value;
  const manage = canManage(loaded.session.user, ["attendance"]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{showTime(record.event_time)}</h1>
        <p className="text-muted-foreground text-sm">{show(record.developer?.full_name)} · {record.work_date}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Record</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Type", value: codeLabel(locale, record.event_type) },
              { label: "Source", value: codeLabel(locale, record.source) },
              { label: "Device", value: show(record.device_code) },
              { label: "Scan", value: record.rfid_event ? String(record.rfid_event) : "—" },
              { label: "Note", value: show(record.note) },
              { label: "Void", value: record.is_void ? `${t(locale, "Yes")} · ${show(record.void_reason)}` : t(locale, "No") },
              { label: "Voided at", value: showTime(record.voided_at) },
            ]}
          />
        </CardContent>
      </Card>
      {manage && !record.is_void ? (
        <Card>
          <CardHeader>
            <CardTitle>Void</CardTitle>
            <CardDescription>The row stays in history with this reason.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldForm
              action={voidAttendance.bind(null, record.id)}
              submitLabel="Void record"
              variant="destructive"
              fields={[{ name: "reason", label: "Reason", required: true }]}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
