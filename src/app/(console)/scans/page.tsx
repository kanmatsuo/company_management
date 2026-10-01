import type { components } from "@/api/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Event = components["schemas"]["RFIDEvent"];

const RESULT: Record<string, string> = {
  ACCEPTED: "Accepted",
  DUPLICATE: "Duplicate",
  UNKNOWN_CARD: "Unknown card",
  UNASSIGNED_CARD: "Unassigned card",
  BLOCKED_CARD: "Blocked card",
  RETIRED_CARD: "Retired card",
  INACTIVE_DEVELOPER: "Inactive developer",
};

export default async function ScansPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const query = await searchParams;
  const data = await loadRecords<Event>(
    "rfid.view",
    listPath("/api/v1/rfid/events/?ordering=-event_time", { result: one(query.result) }),
  );
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open scans.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <RecordList
      title="Scans"
      summary={`${data.count.toLocaleString()} scans`}
      description="Newest card scans first."
      error={data.error}
      empty="No scans yet."
      headers={["Time", "UID", "Reader", "Person", "Result"]}
      hrefs={data.results.map((event) => `/scans/${event.id}`)}
      rows={data.results.map((event) => [
        showTime(event.event_time),
        event.uid,
        event.device_code,
        show(event.developer?.full_name),
        RESULT[event.result] ?? event.result,
      ])}
    />
  );
}
