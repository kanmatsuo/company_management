import { Title, Hint } from "@/components/auto-text";
import { createCard } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can, canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { djangoFetch } from "@/lib/django";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { RegisterByReader } from "@/app/(console)/cards/new/register-by-reader";
import { getLocale } from "@/lib/locale";

export default async function NewCardPage() {
  const locale = await getLocale();
  const session = await requireSession();
  if (!can(session.user, "card.register")) return <NoAccess description="Your account cannot register cards." />;
  let readers: Reader[] = [];
  if (can(session.user, "card.assign")) {
    try {
      readers = (await djangoFetch<{ devices: Reader[] }>("/api/v1/rfid/card-reads/", { accessToken: session.token })).devices;
    } catch {
      readers = []; // typing the UID still works
    }
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New card</Title>
        <Hint>Cards are retired, not deleted, so scan history stays intact.</Hint>
      </div>
      {can(session.user, "card.assign") ? <RegisterByReader readers={readers} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{readers.length > 0 ? "Or type the UID" : "Card"}</CardTitle>
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
