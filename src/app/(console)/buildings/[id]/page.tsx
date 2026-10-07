import { redirect } from "next/navigation";
import { deleteBuilding, updateBuilding } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { FieldForm } from "@/components/field-form";
import { LoadError, NoAccess } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage } from "@/lib/current-user";
import { roleUserChoices } from "@/lib/choices";
import { loadOne } from "@/lib/page-data";

type Building = components["schemas"]["Building"] & { managers?: number[]; owners?: number[] };

export default async function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/buildings");
  const loaded = await loadOne<Building>(`/api/v1/rfid/buildings/${id}/`);
  if (!loaded.value) return <LoadError title="Building" message={loaded.error ?? "Not found."} />;
  const building = loaded.value;
  const manage = can(loaded.session.user, "building.manage");
  const assignPeople = can(loaded.session.user, "user.manage") || can(loaded.session.user, "role.assign");
  const [owners, managers] = assignPeople
    ? await Promise.all([
        roleUserChoices(loaded.session.token, "BUILDING_OWNER"),
        roleUserChoices(loaded.session.token, "BUILDING_MANAGER"),
      ])
    : [[], []];
  if (!manage && !can(loaded.session.user, "reader.view")) {
    return <NoAccess description="Your account cannot open buildings." />;
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{building.name}</h1>
        <p className="text-muted-foreground text-sm">{building.code}</p>
      </div>
      {manage ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Edit</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldForm
                action={updateBuilding.bind(null, building.id)}
                submitLabel="Save"
                fields={[
                  { name: "code", label: "Code", required: true, defaultValue: building.code },
                  { name: "name", label: "Name", required: true, defaultValue: building.name },
                  ...(assignPeople
                    ? [
                        { name: "owners", label: "Owners", type: "users" as const, options: owners, defaultValue: (building.owners ?? []).join(",") },
                        { name: "managers", label: "Managers", type: "users" as const, options: managers, defaultValue: (building.managers ?? []).join(",") },
                      ]
                    : []),
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delete</CardTitle>
              <CardDescription>A building that still has doors stays in place and the server reports that it is in use.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={deleteBuilding.bind(null, building.id)} submitLabel="Delete building" variant="destructive" fields={[]} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
