import { createCourt } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Title, Hint } from "@/components/auto-text";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can, runsStore } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";

export default async function NewCourtPage() {
  const session = await requireSession();
  if (!can(session.user, "court.manage") && !(await runsStore())) return <NoAccess description="Your account cannot add courts." />;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New court</Title>
        <Hint>A court is booked by time slot at the playground desk. It has no stock.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Court</CardTitle>
          <CardDescription>The price is charged per slot. The money goes to the playground store.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createCourt}
            submitLabel="Create court"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "price", label: "Price per slot", required: true },
              { name: "slot_minutes", label: "Slot minutes", type: "number", required: true, defaultValue: "60" },
              { name: "opening_time", label: "Opens", type: "time", required: true, defaultValue: "08:00" },
              { name: "closing_time", label: "Closes", type: "time", required: true, defaultValue: "20:00" },
              { name: "max_slots_per_booking", label: "Max slots per booking", type: "number", defaultValue: "4" },
              { name: "max_slots_per_day", label: "Max slots per person per day", type: "number", defaultValue: "4" },
              { name: "max_days_ahead", label: "Max days ahead", type: "number", defaultValue: "30" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "on" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
