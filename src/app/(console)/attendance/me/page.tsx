import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Day = components["schemas"]["DailyAttendance"];

export default async function MyAttendancePage() {
  const data = await loadList<Day>("/api/v1/attendance/daily/me/?ordering=-work_date");
  return (
    <RecordList
      title="My attendance"
      summary={`${data.count.toLocaleString()} days`}
      description="Daily rows for the signed-in developer."
      error={data.error}
      empty="No attendance for this account."
      headers={["Date", "Status", "Hours", "Scans", "First", "Last"]}
      hrefs={data.results.map((day) => `/attendance/${day.id}`)}
      rows={data.results.map((day) => [
        day.work_date,
        show(day.status),
        show(day.worked_hours),
        String(day.record_count),
        showTime(day.first_seen),
        showTime(day.last_seen),
      ])}
    />
  );
}
