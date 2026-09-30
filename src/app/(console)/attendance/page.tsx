import type { components } from "@/api/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { listPath, one, show } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Day = components["schemas"]["DailyAttendance"];

const STATUS: Record<string, string> = {
  PRESENT: "Present",
  INCOMPLETE: "Incomplete",
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const data = await loadRecords<Day>(
    "attendance.view",
    listPath("/api/v1/attendance/daily/?ordering=-work_date", { status: one(query.status) }),
  );
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open attendance.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <RecordList
      title="Attendance"
      summary={`${data.count.toLocaleString()} daily rows`}
      description="One row per person per day. A missing day means there were no scans."
      error={data.error}
      empty="No attendance yet."
      headers={["Date", "Person", "Department", "Status", "Hours", "Scans", "First", "Last"]}
      rows={data.results.map((day) => [
        day.work_date,
        show(day.developer?.full_name),
        show(day.developer?.department),
        STATUS[day.status] ?? day.status,
        show(day.worked_hours),
        String(day.record_count),
        new Date(day.first_seen).toLocaleTimeString(),
        day.last_seen ? new Date(day.last_seen).toLocaleTimeString() : "—",
      ])}
    />
  );
}
