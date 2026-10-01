import { createPosition } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { sellerChoices } from "@/lib/choices";

export default async function NewPositionPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["service", "position", "seller"])) {
    return <NoAccess description="Your account cannot create service positions." />;
  }
  const sellers = await sellerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">New service position</h1>
        <p className="text-muted-foreground text-sm">Sellers manage their own positions. Managers can manage all of them.</p>
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
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
