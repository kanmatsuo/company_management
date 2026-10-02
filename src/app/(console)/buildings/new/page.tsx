import { Title, Hint } from "@/components/auto-text";
import { createBuilding } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";

export default async function NewBuildingPage() {
  const session = await requireSession();
  if (!can(session.user, "rfid.device.manage") && !canManage(session.user, ["rfid"])) {
    return <NoAccess description="Your account cannot create buildings." />;
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New building</Title>
        <Hint>Code is the short label, such as B1.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Building</CardTitle>
          <CardDescription>Doors are registered separately and point at this building.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm action={createBuilding} submitLabel="Create building" fields={[
            { name: "code", label: "Code", required: true, placeholder: "B1" },
            { name: "name", label: "Name", required: true, placeholder: "Building 1" },
          ]} />
        </CardContent>
      </Card>
    </div>
  );
}
