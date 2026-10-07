import { Title, Hint } from "@/components/auto-text";
import Link from "@/components/app-link";
import { DeviceForm } from "@/app/(console)/readers/device-form";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoAccess } from "@/components/no-access";
import { can, canManage, getSession } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { redirect } from "next/navigation";

type Building = components["schemas"]["Building"];

export default async function NewReaderPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canManage(session.user, ["rfid"]) && !can(session.user, "rfid.device.manage")) {
    return <NoAccess description="Your account cannot register devices." />;
  }
  let buildings: Building[] = [];
  try {
    buildings = await djangoFetch<Building[]>("/api/v1/rfid/buildings/", { accessToken: session.token });
  } catch (error) {
    if (!(error instanceof DjangoError)) throw error;
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Title>New device</Title>
          <Hint>The code must match the ID the hardware sends, such as Door1 or Reader2.</Hint>
        </div>
        <Button asChild variant="outline"><Link href="/buildings">Buildings</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Device</CardTitle>
          <CardDescription>There is no delete. Clear Active later to turn a device off. Registration still shows an API key once, even for a door that uses a fixed IP.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceForm
            buildings={buildings.map((building) => ({ id: building.id, label: `${building.code} · ${building.name}` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
