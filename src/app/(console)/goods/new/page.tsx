import { createGood } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Title, Hint } from "@/components/auto-text";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage, runsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

export default async function NewGoodPage({ searchParams }: { searchParams: Promise<{ position?: string }> }) {
  const position = (await searchParams).position;
  const session = await requireSession();
  if (!canManage(session.user, ["goods", "good", "seller"]) && !(await runsStore())) return <NoAccess description="Your account cannot create goods." />;
  const positions = await positionChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New good</Title>
        <Hint>Stock changes after creation go through the stock action.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Good</CardTitle>
          <CardDescription>A product or a service sold at the till. The counter decides which store sells it. Courts are added under Playground.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createGood}
            submitLabel="Create good"
            fields={[
              { name: "service_position", label: "Counter", type: "select", required: true, options: positions, defaultValue: position && /^\d+$/.test(position) ? position : undefined },
              { name: "name", label: "Name", required: true },
              { name: "price", label: "Price", required: true },
              { name: "kind", label: "Kind", type: "select", options: [
                { value: "PRODUCT", label: "Product" },
                { value: "SERVICE", label: "Service" },
              ], defaultValue: "PRODUCT" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "initial_quantity", label: "Initial quantity", type: "number" },
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
              { name: "track_stock", label: "Track stock", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
