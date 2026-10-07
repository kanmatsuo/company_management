import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { can, canManage, getSession } from "@/lib/current-user";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Device = components["schemas"]["RFIDDevice"];

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ is_active?: string; online?: string; purpose?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  const manage = session ? canManage(session.user, ["rfid"]) || can(session.user, "rfid.device.manage") : false;
  const data = await loadRecords<Device>(
    "rfid.view",
    listPath("/api/v1/rfid/devices/?ordering=code", {
      is_active: one(query.is_active),
      online: one(query.online),
      purpose: one(query.purpose),
    }),
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
      description="Door units, till readers and card assign readers. Online means the device sent a tap in the last two minutes."
      error={data.error}
      empty="No devices yet."
      headers={["Code", "Name", "Status", "Kind", "Place", "Seller", "Door IP", "Active", "Last seen"]}
      extra={manage ? <Button asChild><Link href="/readers/new">New device</Link></Button> : null}
      hrefs={data.results.map((device) => `/readers/${device.id}`)}
      rows={data.results.map((device) => [
        device.code,
        show(device.name),
        device.online ? "Online" : "Offline",
        show(device.purpose),
        device.purpose === "TILL" ? "Till" : String(device.purpose) === "ENROLL" ? "Card assign" : (device.building ? `Building ${device.building}` : "—"),
        show((device as { seller_name?: string | null }).seller_name),
        show(device.allowed_ip),
        device.is_active ? "Yes" : "No",
        showTime(device.last_seen_at),
      ])}
    />
  );
}
