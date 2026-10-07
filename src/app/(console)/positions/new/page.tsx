import { Title, Hint } from "@/components/auto-text";
import { createPosition } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can, ownsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { buildingChoices, sellerChoices, sellerUserChoices } from "@/lib/choices";

export default async function NewPositionPage({ searchParams }: { searchParams: Promise<{ seller?: string }> }) {
  const seller = (await searchParams).seller;
  const session = await requireSession();
  if (!can(session.user, "counter.manage") && !(await ownsStore(session.user.id))) {
    return <NoAccess description="Your account cannot add counters." />;
  }
  const [sellers, buildings, users] = await Promise.all([
    sellerChoices(session.token),
    buildingChoices(session.token),
    sellerUserChoices(session.token),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New counter</Title>
        <Hint>A counter is a place where a store sells: a till, stall or desk.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Counter</CardTitle>
          <CardDescription>Store owners can leave the store empty: the counter is added to their own store.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createPosition}
            submitLabel="Add counter"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "seller", label: "Store", type: "select", options: sellers, defaultValue: seller && /^\d+$/.test(seller) ? seller : undefined },
              { name: "location", label: "Location" },
              { name: "building", label: "Building", type: "select", options: buildings },
              { name: "manager", label: "Counter manager (SELLER role)", type: "select", options: [{ value: "", label: "No manager" }, ...users] },
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
