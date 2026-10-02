import { Title, Hint } from "@/components/auto-text";
import { createPosition } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage, ownsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { buildingChoices, sellerChoices, sellerUserChoices } from "@/lib/choices";

export default async function NewPositionPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["service", "position", "seller"]) && !(await ownsStore(session.user.id))) {
    return <NoAccess description="Your account cannot create service positions." />;
  }
  const [sellers, buildings, users] = await Promise.all([
    sellerChoices(session.token),
    buildingChoices(session.token),
    sellerUserChoices(session.token),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New service position</Title>
        <Hint>Sellers manage their own positions. Managers can manage all of them.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Position</CardTitle>
          <CardDescription>Leave the seller empty when you are creating it for your own seller.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createPosition}
            submitLabel="Create position"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "seller", label: "Seller", type: "select", options: sellers },
              { name: "location", label: "Location" },
              { name: "building", label: "Building", type: "select", options: buildings },
              { name: "manager", label: "Position manager (SELLER role)", type: "select", options: [{ value: "", label: "No manager" }, ...users] },
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
