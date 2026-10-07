import { DeleteForGood } from "@/components/delete-for-good";
import { redirect } from "next/navigation";
import { deleteDeveloper } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { CardPanel, type CurrentCard } from "@/app/(console)/developers/[id]/card-panel";
import { ProfileForm } from "@/app/(console)/developers/[id]/profile-form";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage } from "@/lib/current-user";
import { djangoFetch } from "@/lib/django";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { buildingChoices, departmentNames } from "@/lib/choices";

type Developer = components["schemas"]["Developer"] & { building?: number | null; building_name?: string | null };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

async function currentCard(token: string, developerId: number): Promise<CurrentCard | null> {
  try {
    const page = await djangoFetch<{ results: { card: number; card_uid: string; assigned_at?: string }[] }>(
      `/api/v1/rfid/assignments/?developer=${developerId}&active=true`,
      { accessToken: token },
    );
    const assignment = page.results[0];
    if (!assignment) return null;
    const card = await djangoFetch<{ id: number; uid: string; label?: string; status?: string }>(`/api/v1/rfid/cards/${assignment.card}/`, {
      accessToken: token,
    }).catch(() => null);
    return {
      id: assignment.card,
      uid: card?.uid ?? assignment.card_uid,
      label: card?.label ?? null,
      status: card?.status,
      assigned_at: assignment.assigned_at ?? null,
    };
  } catch {
    return null;
  }
}

export default async function DeveloperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/developers");
  const loaded = await loadOne<Developer>(`/api/v1/developers/${id}/`);
  if (!loaded.value) return <LoadError title="Developer" message={loaded.error ?? "Not found."} />;
  const developer = loaded.value;
  const { user, token } = loaded.session;
  const manage = canManage(user, ["developer"]);
  const assignCards = can(user, "card.assign");
  const [buildings, departments, card, readers] = await Promise.all([
    manage ? buildingChoices(token) : Promise.resolve([]),
    manage ? departmentNames(token) : Promise.resolve([]),
    can(user, "card.view") ? currentCard(token, developer.id) : Promise.resolve(null),
    assignCards
      ? djangoFetch<{ devices: Reader[] }>("/api/v1/rfid/card-reads/", { accessToken: token })
          .then((body) => body.devices)
          .catch(() => [] as Reader[])
      : Promise.resolve(null),
  ]);
  const status = developer.status ?? "ACTIVE";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{developer.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="font-medium text-foreground tabular-nums">{developer.employee_number}</span>
            <Badge variant={status === "ACTIVE" ? "secondary" : "outline"}>{STATUS_LABEL[status] ?? status}</Badge>
            {developer.department ? <span>· {developer.department}</span> : null}
            {developer.building_name ? <span>· {developer.building_name}</span> : null}
            <span>· Updated {showTime(developer.updated_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>A last working day does not change status or release the card. Set status to Terminated when someone leaves.</CardDescription>
          </CardHeader>
          <CardContent>
            {manage ? (
              <ProfileForm
                id={developer.id}
                buildings={buildings}
                departments={departments}
                defaults={{
                  employee_number: developer.employee_number,
                  full_name: developer.full_name,
                  phone: developer.phone ?? "",
                  home_address: developer.home_address ?? "",
                  birthday: developer.birthday ?? "",
                  department: developer.department ?? "",
                  position_title: developer.position_title ?? "",
                  building: developer.building ? String(developer.building) : "",
                  start_date: developer.start_date ?? "",
                  out_date: developer.out_date ?? "",
                  status,
                }}
              />
            ) : (
              <Facts
                items={[
                  { label: "Phone", value: show(developer.phone) },
                  { label: "Home address", value: show(developer.home_address) },
                  { label: "Birthday", value: show(developer.birthday) },
                  { label: "Department", value: show(developer.department) },
                  { label: "Title", value: show(developer.position_title) },
                  { label: "Home building", value: show(developer.building_name) },
                  { label: "Status", value: show(developer.status) },
                  { label: "Started", value: show(developer.start_date) },
                  { label: "Last day", value: show(developer.out_date) },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {can(user, "card.view") ? (
          <Card>
            <CardHeader>
              <CardTitle>RFID card</CardTitle>
              <CardDescription>The card used at the doors and tills.</CardDescription>
            </CardHeader>
            <CardContent>
              <CardPanel developerId={developer.id} current={card} readers={readers} />
            </CardContent>
          </Card>
        ) : null}
      </div>

      {manage || can(user, "system.delete_records") ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {manage ? (
            <Card>
              <CardHeader>
                <CardTitle>Remove</CardTitle>
                <CardDescription>Hides this person (soft delete); their history stays. Prefer Terminated when they are leaving the company.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={deleteDeveloper.bind(null, developer.id)} submitLabel="Delete developer" variant="destructive" fields={[]} />
              </CardContent>
            </Card>
          ) : null}
          {can(user, "system.delete_records") ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle>Delete for good</CardTitle>
                <CardDescription>Deletes this person and everything recorded about them: scans, attendance, money and purchases. Their login and card stay.</CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteForGood kind="developer" id={developer.id} redirectTo="/developers" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
