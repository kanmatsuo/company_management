import { createAttendanceRecord } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { developerChoices } from "@/lib/choices";

export default async function NewAttendanceRecordPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["attendance"])) {
    return <NoAccess description="Your account cannot add attendance records." />;
  }
  const developers = await developerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Manual attendance</h1>
        <p className="text-muted-foreground text-sm">Add a missing moment. Choose Out when someone is still counted inside because they never scanned out.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Record</CardTitle>
          <CardDescription>Records are voided later, not deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createAttendanceRecord}
            submitLabel="Add record"
            fields={[
              { name: "developer", label: "Developer", type: "select", required: true, options: developers },
              { name: "event_time", label: "When", type: "datetime-local", required: true },
              { name: "direction", label: "Direction", type: "select", options: [{ value: "IN", label: "In" }, { value: "OUT", label: "Out" }] },
              { name: "note", label: "Note", type: "textarea", required: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
