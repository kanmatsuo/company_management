import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Day = components["schemas"]["DailyAttendance"];

export default async function AttendanceDayPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/attendance");
  const loaded = await loadOne<Day>(`/api/v1/attendance/daily/${id}/`);
  if (!loaded.value) return <LoadError title="Attendance day" message={loaded.error ?? "Not found."} />;
  const day = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{day.work_date}</h1>
        <p className="text-muted-foreground text-sm">{show(day.developer?.full_name)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily row</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Person", value: show(day.developer?.full_name) },
              { label: "Department", value: show(day.developer?.department) },
              { label: "Status", value: show(day.status) },
              { label: "Hours", value: show(day.worked_hours) },
              { label: "Records", value: String(day.record_count) },
              { label: "Worked seconds", value: String(day.worked_seconds) },
              { label: "First", value: showTime(day.first_seen) },
              { label: "Last", value: showTime(day.last_seen) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
