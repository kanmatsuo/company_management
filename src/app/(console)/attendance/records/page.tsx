import Link from "next/link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Record = components["schemas"]["AttendanceRecord"];

export default async function AttendanceRecordsPage() {
  const session = await getSession();
  const manage = session ? canManage(session.user, ["attendance"]) : false;
  const data = await loadRecords<Record>("attendance.view", "/api/v1/attendance/records/?ordering=-event_time");
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open attendance records.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <RecordList
      title="Attendance records"
      summary={`${data.count.toLocaleString()} records`}
      description="Each scan or manual correction. Voided rows stay in the list."
      error={data.error}
      empty="No records yet."
      headers={["Time", "Date", "Person", "Type", "Source", "Device", "Void", "Note"]}
      extra={manage ? <Button asChild><Link href="/attendance/records/new">Manual record</Link></Button> : null}
      hrefs={data.results.map((record) => `/attendance/records/${record.id}`)}
      rows={data.results.map((record) => [
        showTime(record.event_time),
        record.work_date,
        show(record.developer?.full_name),
        record.event_type,
        record.source,
        show(record.device_code),
        record.is_void ? `Yes${record.void_reason ? `: ${record.void_reason}` : ""}` : "No",
        show(record.note),
      ])}
      struck={data.results.map((record) => record.is_void)}
    />
  );
}
