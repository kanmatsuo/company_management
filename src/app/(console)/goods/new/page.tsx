import { createGood } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Title, Hint } from "@/components/auto-text";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage, runsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

export default async function NewGoodPage() {
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
          <CardDescription>Price is a decimal and must be above 0 for a rental. The service position decides who sells it.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createGood}
            submitLabel="Create good"
            fields={[
              { name: "service_position", label: "Service position", type: "select", required: true, options: positions },
              { name: "name", label: "Name", required: true },
              { name: "price", label: "Price", required: true },
              { name: "kind", label: "Kind", type: "select", options: [
                { value: "PRODUCT", label: "Product" },
                { value: "SERVICE", label: "Service" },
                { value: "RENTAL", label: "Rental" },
              ], defaultValue: "PRODUCT" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "initial_quantity", label: "Initial quantity", type: "number" },
              { name: "slot_minutes", label: "Rental slot minutes", type: "number", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "opening_time", label: "Rental opens", placeholder: "08:00", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "closing_time", label: "Rental closes", placeholder: "20:00", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "max_slots_per_booking", label: "Max slots per booking", type: "number", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "max_slots_per_day", label: "Max slots per person per day", type: "number", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "max_days_ahead", label: "Max days ahead", type: "number", visibleWhen: { name: "kind", value: "RENTAL" } },
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
              { name: "track_stock", label: "Track stock", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
