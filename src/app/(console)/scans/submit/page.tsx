import { Title, Hint } from "@/components/auto-text";
import { submitScan } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";

export default async function SubmitScanPage() {
  const session = await requireSession();
  if (!can(session.user, "reader.manage")) return <NoAccess description="Your account cannot submit reader scans." />;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Submit scan</Title>
        <Hint>Readers send scans with their own key, not a user session.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Device request</CardTitle>
          <CardDescription>The same client event id is accepted once. A repeat returns the original result.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={submitScan}
            submitLabel="Send scan"
            fields={[
              { name: "device_key", label: "Reader key", type: "password", required: true },
              { name: "uid", label: "Card UID", required: true },
              { name: "device_id", label: "Device code" },
              { name: "event_time", label: "Event time", type: "datetime-local" },
              { name: "client_event_id", label: "Client event id" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
