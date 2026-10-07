import { Title, Hint } from "@/components/auto-text";
import { createStore } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { buildingChoices, sellerUserChoices, unassignedTillReaderChoices } from "@/lib/choices";

/** New store in one step: its login, the store, its first counter and its till reader. */
export default async function NewStorePage() {
  const session = await requireSession();
  if (!can(session.user, "seller.create")) return <NoAccess description="Your account cannot create stores." />;
  const makeLogin = can(session.user, "user.manage");
  const assignReader = can(session.user, "rfid.device.manage");
  const [users, buildings, readers] = await Promise.all([
    sellerUserChoices(session.token),
    buildingChoices(session.token),
    assignReader ? unassignedTillReaderChoices(session.token) : Promise.resolve([]),
  ]);
  const loginModes = [
    ...(makeLogin ? [{ value: "new", label: "Create a new login" }] : []),
    { value: "existing", label: "Use an existing seller login" },
    { value: "none", label: "No login yet" },
  ];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New store</Title>
        <Hint>The store, its login, its first counter and its till reader, saved together in one step.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>
            The counter is named after the store unless you name it. More counters and readers can be added on the store&apos;s page later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createStore}
            submitLabel="Create store"
            fields={[
              { name: "name", label: "Store name", required: true, placeholder: "Peak Cafe" },
              { name: "contact_name", label: "Contact name" },
              { name: "phone", label: "Phone" },
              { name: "login", label: "Store login", type: "select", options: loginModes, defaultValue: loginModes[0].value },
              { name: "username", label: "Username", visibleWhen: { name: "login", value: "new" } },
              { name: "password", label: "Password", type: "password", visibleWhen: { name: "login", value: "new" } },
              { name: "user", label: "Seller login", type: "select", options: users, visibleWhen: { name: "login", value: "existing" } },
              { name: "counter_name", label: "First counter", placeholder: "Same as the store name" },
              { name: "building", label: "Building", type: "select", options: [{ value: "", label: "None" }, ...buildings] },
              { name: "location", label: "Location", placeholder: "Lobby, 1st floor" },
              ...(assignReader
                ? [
                    {
                      name: "till_reader",
                      label: "Till reader",
                      type: "select" as const,
                      options: [{ value: "", label: readers.length ? "None for now" : "No unassigned till reader" }, ...readers],
                    },
                  ]
                : []),
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
