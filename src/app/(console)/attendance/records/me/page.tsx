import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Record = components["schemas"]["AttendanceRecord"];

export default async function MyAttendanceRecordsPage() {
  const data = await loadList<Record>("/api/v1/attendance/records/me/?ordering=-event_time");
  return (
    <RecordList
      title="My attendance records"
      summary={`${data.count.toLocaleString()} records`}
      description="Scans and manual corrections for the signed-in developer."
      error={data.error}
      empty="No records for this account."
      headers={["Time", "Type", "Source", "Device", "Void", "Note"]}
      hrefs={data.results.map((record) => `/attendance/records/${record.id}`)}
      rows={data.results.map((record) => [
        showTime(record.event_time),
        record.event_type,
        record.source,
        show(record.device_code),
        record.is_void ? "Yes" : "No",
        show(record.note),
      ])}
    />
  );
}
