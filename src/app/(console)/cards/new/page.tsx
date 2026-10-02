import { Title, Hint } from "@/components/auto-text";
import { createCard } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";

export default async function NewCardPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["rfid"])) return <NoAccess description="Your account cannot register cards." />;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New card</Title>
        <Hint>Cards are retired, not deleted, so scan history stays intact.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Card</CardTitle>
          <CardDescription>The UID is printed on the card and sent by readers.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createCard}
            submitLabel="Register card"
            fields={[
              { name: "uid", label: "UID", required: true },
              { name: "label", label: "Label" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
