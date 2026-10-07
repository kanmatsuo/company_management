import { assignReader } from "@/app/(console)/mutations";
import { DeleteForGood } from "@/components/delete-for-good";
import { redirect } from "next/navigation";
import { DeviceForm } from "@/app/(console)/readers/device-form";
import { rotateReaderKey } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { sellerChoices } from "@/lib/choices";

type Device = components["schemas"]["RFIDDevice"];
type Building = components["schemas"]["Building"];

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/readers");
  const loaded = await loadOne<Device>(`/api/v1/rfid/devices/${id}/`);
  if (!loaded.value) return <LoadError title="Device" message={loaded.error ?? "Not found."} />;
  const device = loaded.value;
  const session = await getSession();
  const manage = session ? canManage(session.user, ["rfid"]) || can(session.user, "rfid.device.manage") : false;
  let buildings: Building[] = [];
  if (session && manage) {
    try {
      buildings = await djangoFetch<Building[]>("/api/v1/rfid/buildings/", { accessToken: session.token });
    } catch (error) {
      if (!(error instanceof DjangoError)) throw error;
    }
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{device.code}</h1>
        <p className="text-muted-foreground text-sm">
          {device.purpose} · {device.online ? "Online" : "Offline"} · Key prefix {show(device.api_key_prefix)} · Last seen {showTime(device.last_seen_at)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>A door unit has a building and its own fixed IP; units of one door share the code. Till and card assign readers are recognised by their code alone.</CardDescription>
        </CardHeader>
        <CardContent>
          {manage ? (
            <DeviceForm
              id={device.id}
              buildings={buildings.map((building) => ({ id: building.id, label: `${building.code} · ${building.name}` }))}
              defaults={{
                code: device.code,
                name: device.name ?? "",
                location: device.location ?? "",
                purpose: device.purpose ?? "ATTENDANCE",
                building: device.building ? String(device.building) : "",
                servicePosition: device.service_position ? String(device.service_position) : "",
                allowedIp: device.allowed_ip ?? "",
                direction: device.direction ?? "BOTH",
                active: Boolean(device.is_active),
              }}
            />
          ) : (
            <Facts
              items={[
                { label: "Building", value: device.building ? String(device.building) : "—" },
                { label: "Seller", value: show((device as { seller_name?: string | null }).seller_name) },
                { label: "Allowed IP", value: show(device.allowed_ip) },
                { label: "Last IP", value: show(device.last_ip) },
                { label: "Version", value: show(device.app_version) },
                { label: "Active", value: device.is_active ? "Yes" : "No" },
              ]}
            />
          )}
        </CardContent>
      </Card>
      {device.purpose === "TILL" ? (
        <Card>
          <CardHeader>
            <CardTitle>Assigned to</CardTitle>
            <CardDescription>
              {(device as { seller_name?: string | null }).seller_name
                ? `Only ${(device as { seller_name?: string | null }).seller_name}'s purchases use this reader.`
                : "Not assigned: no seller uses this reader yet."}
            </CardDescription>
          </CardHeader>
          {manage ? (
            <CardContent>
              <FieldForm
                action={assignReader.bind(null, device.id, `/readers/${device.id}`)}
                submitLabel="Save assignment"
                fields={[
                  {
                    name: "seller",
                    label: "Seller",
                    type: "select",
                    options: [{ value: "", label: "Not assigned" }, ...(await sellerChoices(loaded.session.token))],
                    defaultValue: (device as { seller?: number | null }).seller ? String((device as { seller?: number | null }).seller) : "",
                  },
                ]}
              />
            </CardContent>
          ) : null}
        </Card>
      ) : null}
      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>Rotate key</CardTitle>
            <CardDescription>The old key stops working immediately. Copy the new key before you leave. You will not see it again.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldForm action={rotateReaderKey.bind(null, device.id)} submitLabel="Rotate key" variant="outline" fields={[]} />
          </CardContent>
        </Card>
      ) : null}
      {session?.user && can(session?.user, "system.delete_records") ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Delete for good</CardTitle>
            <CardDescription>Deletes the reader, its scans, the attendance made from them and its TCP log. Purchases through it stay.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteForGood kind="reader" id={device.id} redirectTo="/readers" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
