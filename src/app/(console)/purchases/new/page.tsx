import { createPurchase } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

export default async function NewPurchasePage() {
  const session = await requireSession();
  if (!canManage(session.user, ["purchase", "seller"])) return <NoAccess description="Your account cannot open a till draft." />;
  const positions = await positionChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">New purchase</h1>
        <p className="text-muted-foreground text-sm">Creates a draft. Add goods, then confirm with the buyer card and PIN.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Till</CardTitle>
          <CardDescription>The service position owns the goods that can be added.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createPurchase}
            submitLabel="Open draft"
            fields={[{ name: "service_position", label: "Service position", type: "select", required: true, options: positions }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
