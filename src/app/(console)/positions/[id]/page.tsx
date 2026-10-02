import { redirect } from "next/navigation";
import { deletePosition, updatePosition } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage, runsStore } from "@/lib/current-user";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { buildingChoices, sellerChoices, sellerUserChoices } from "@/lib/choices";

type Position = components["schemas"]["ServicePosition"] & {
  building?: number | null;
  building_name?: string | null;
  manager?: number | null;
  manager_email?: string | null;
};

export default async function PositionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/positions");
  const loaded = await loadOne<Position>(`/api/v1/service-positions/${id}/`);
  if (!loaded.value) return <LoadError title="Service position" message={loaded.error ?? "Not found."} />;
  const position = loaded.value;
  const manage = canManage(loaded.session.user, ["service", "position", "seller"]) || await runsStore();
  const [sellers, buildings, users] = manage
    ? await Promise.all([
        sellerChoices(loaded.session.token),
        buildingChoices(loaded.session.token),
        sellerUserChoices(loaded.session.token),
      ])
    : [[], [], []];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{position.name}</h1>
        <p className="text-muted-foreground text-sm">{show(position.seller_detail?.name)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {manage ? (
            <FieldForm
              action={updatePosition.bind(null, position.id)}
              submitLabel="Save"
              fields={[
                { name: "name", label: "Name", defaultValue: position.name, required: true },
                { name: "seller", label: "Seller", type: "select", options: sellers, defaultValue: position.seller ? String(position.seller) : "" },
                { name: "location", label: "Location", defaultValue: position.location ?? "" },
                { name: "building", label: "Building", type: "select", options: buildings, defaultValue: position.building ? String(position.building) : "" },
                { name: "manager", label: "Position manager (SELLER role)", type: "select", options: [{ value: "", label: "No manager" }, ...users], defaultValue: position.manager ? String(position.manager) : "" },
                { name: "is_active", label: "Active", type: "checkbox", defaultValue: position.is_active ? "on" : "" },
              ]}
            />
          ) : (
            <Facts
              items={[
                { label: "Location", value: show(position.location) },
                { label: "Building", value: show(position.building_name) },
                { label: "Position manager", value: show(position.manager_email) },
                { label: "Active", value: position.is_active ? "Yes" : "No" },
              ]}
            />
          )}
        </CardContent>
      </Card>
      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>Remove</CardTitle>
            <CardDescription>Soft-deletes this position.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldForm action={deletePosition.bind(null, position.id)} submitLabel="Delete position" variant="destructive" fields={[]} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
