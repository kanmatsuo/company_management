import { DeleteForGood } from "@/components/delete-for-good";
import { redirect } from "next/navigation";
import { assignCard, blockCard, replaceCard, retireCard, unassignCard, unblockCard, updateCard } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { buildingChoices, developerChoices } from "@/lib/choices";

type CardRow = components["schemas"]["RFIDCard"];

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/cards");
  const loaded = await loadOne<CardRow>(`/api/v1/rfid/cards/${id}/`);
  if (!loaded.value) return <LoadError title="Card" message={loaded.error ?? "Not found."} />;
  const card = loaded.value;
  const manage = canManage(loaded.session.user, ["rfid"]);
  const holder = card.current_assignment?.developer?.full_name;
  const assigned = Boolean(card.current_assignment);
  const [developers, buildings] = manage && !assigned
    ? await Promise.all([developerChoices(loaded.session.token), buildingChoices(loaded.session.token)])
    : [[], []];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{card.uid}</h1>
        <p className="text-muted-foreground text-sm">{card.status} · {show(holder)} · Updated {showTime(card.updated_at)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>{show(card.status_reason)}</CardDescription>
        </CardHeader>
        <CardContent>
          {manage ? (
            <FieldForm
              action={updateCard.bind(null, card.id)}
              submitLabel="Save"
              fields={[
                { name: "label", label: "Label", defaultValue: card.label ?? "" },
                { name: "notes", label: "Notes", type: "textarea", defaultValue: card.notes ?? "" },
              ]}
            />
          ) : (
            <Facts items={[{ label: "Label", value: show(card.label) }, { label: "Notes", value: show(card.notes) }]} />
          )}
        </CardContent>
      </Card>
      {manage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {assigned ? (
            <Card>
              <CardHeader>
                <CardTitle>Unassign</CardTitle>
                <CardDescription>Take the card back. The history stays.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={unassignCard.bind(null, card.id)} submitLabel="Unassign" variant="outline" fields={[]} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assign</CardTitle>
                <CardDescription>Give this card to a developer and set their building. The developer types a new 4-6 digit purchase PIN twice.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm
                  action={assignCard.bind(null, card.id)}
                  submitLabel="Assign"
                  fields={[
                    { name: "developer", label: "Developer", type: "select", required: true, options: developers },
                    { name: "building", label: "Building", type: "select", options: [{ value: "", label: "Keep current building" }, ...buildings] },
                    { name: "pin", label: "PIN", type: "password", required: true },
                    { name: "pin_confirm", label: "PIN again", type: "password", required: true },
                  ]}
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Block</CardTitle>
              <CardDescription>Reject scans while the card stays assigned.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={blockCard.bind(null, card.id)} submitLabel="Block" variant="destructive" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unblock</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldForm action={unblockCard.bind(null, card.id)} submitLabel="Unblock" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Retire</CardTitle>
              <CardDescription>Take an unassigned card out of circulation.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={retireCard.bind(null, card.id)} submitLabel="Retire" variant="destructive" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Replace</CardTitle>
              <CardDescription>Issue a new card to the current holder and retire this one.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm
                action={replaceCard.bind(null, card.id)}
                submitLabel="Replace"
                fields={[
                  { name: "new_card_uid", label: "New UID", required: true },
                  { name: "new_card_label", label: "New label" },
                  { name: "reason", label: "Reason" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
      {can(loaded.session.user, "system.delete_records") ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Delete for good</CardTitle>
            <CardDescription>Deletes the card, its scans and the attendance made from them. Purchases paid with it stay.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteForGood kind="card" id={card.id} redirectTo="/cards" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
