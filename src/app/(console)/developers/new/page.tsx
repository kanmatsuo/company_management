import { Title, Hint } from "@/components/auto-text";
import { createDeveloper } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { buildingChoices } from "@/lib/choices";

const STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
];

export default async function NewDeveloperPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["developer"])) {
    return <NoAccess description="Your account cannot create developers." />;
  }
  const buildings = await buildingChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New developer</Title>
        <Hint>Leaving the company is a status change, not a hard delete.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Employee number and full name are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createDeveloper}
            submitLabel="Create developer"
            fields={[
              { name: "employee_number", label: "Employee number", required: true },
              { name: "full_name", label: "Full name", required: true },
              { name: "phone", label: "Phone" },
              { name: "home_address", label: "Home address" },
              { name: "birthday", label: "Birthday", type: "date" },
              { name: "department", label: "Department" },
              { name: "position_title", label: "Title" },
              { name: "building", label: "Home building", type: "select", options: buildings },
              { name: "start_date", label: "Start date", type: "date" },
              { name: "out_date", label: "Last working day", type: "date" },
              { name: "status", label: "Status", type: "select", options: STATUS, defaultValue: "ACTIVE" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
