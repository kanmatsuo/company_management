import type { components } from "@/api/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Device = components["schemas"]["RFIDDevice"];

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ is_active?: string }>;
}) {
  const query = await searchParams;
  const data = await loadRecords<Device>(
    "rfid.view",
    listPath("/api/v1/rfid/devices/?ordering=code", { is_active: one(query.is_active) }),
  );
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open readers.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <RecordList
      title="Readers"
      summary={`${data.count.toLocaleString()} readers`}
      description="Door readers and when each one last reported."
      error={data.error}
      empty="No readers yet."
      headers={["Code", "Name", "Location", "Direction", "Active", "Last seen"]}
      rows={data.results.map((device) => [
        device.code,
        show(device.name),
        show(device.location),
        show(device.direction),
        device.is_active ? "Yes" : "No",
        showTime(device.last_seen_at),
      ])}
    />
  );
}
