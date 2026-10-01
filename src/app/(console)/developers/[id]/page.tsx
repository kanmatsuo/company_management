import { redirect } from "next/navigation";
import { deleteDeveloper, updateDeveloper } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { developerChoices, userChoices } from "@/lib/choices";

type Developer = components["schemas"]["Developer"];

const STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
];

export default async function DeveloperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/developers");
  const loaded = await loadOne<Developer>(`/api/v1/developers/${id}/`);
  if (!loaded.value) return <LoadError title="Developer" message={loaded.error ?? "Not found."} />;
  const developer = loaded.value;
  const manage = canManage(loaded.session.user, ["developer"]);
  const [managers, users] = manage
    ? await Promise.all([developerChoices(loaded.session.token), userChoices(loaded.session.token)])
    : [[], []];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{developer.full_name}</h1>
        <p className="text-muted-foreground text-sm">
          {developer.employee_number} · Updated {showTime(developer.updated_at)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>A last working day does not change status or release the card. Set status to Terminated when someone leaves. Delete is a soft delete.</CardDescription>
        </CardHeader>
        <CardContent>
          {manage ? (
            <FieldForm
              action={updateDeveloper.bind(null, developer.id)}
              submitLabel="Save"
              fields={[
                { name: "employee_number", label: "Employee number", defaultValue: developer.employee_number, required: true },
                { name: "full_name", label: "Full name", defaultValue: developer.full_name, required: true },
                { name: "phone", label: "Phone", defaultValue: developer.phone ?? "" },
                { name: "home_address", label: "Home address", defaultValue: developer.home_address ?? "" },
                { name: "birthday", label: "Birthday", type: "date", defaultValue: developer.birthday ?? "" },
                { name: "department", label: "Department", defaultValue: developer.department ?? "" },
                { name: "position_title", label: "Title", defaultValue: developer.position_title ?? "" },
                { name: "manager", label: "Manager", type: "select", options: managers, defaultValue: developer.manager ? String(developer.manager) : "" },
                { name: "user", label: "Linked user", type: "select", options: users, defaultValue: developer.user ? String(developer.user) : "" },
                { name: "start_date", label: "Start date", type: "date", defaultValue: developer.start_date ?? "" },
                { name: "out_date", label: "Last working day", type: "date", defaultValue: developer.out_date ?? "" },
                { name: "status", label: "Status", type: "select", options: STATUS, defaultValue: developer.status ?? "ACTIVE" },
              ]}
            />
          ) : (
            <Facts
              items={[
                { label: "Phone", value: show(developer.phone) },
                { label: "Home address", value: show(developer.home_address) },
                { label: "Birthday", value: show(developer.birthday) },
                { label: "Department", value: show(developer.department) },
                { label: "Title", value: show(developer.position_title) },
                { label: "Manager", value: show(developer.manager_detail?.full_name) },
                { label: "Status", value: show(developer.status) },
                { label: "Started", value: show(developer.start_date) },
                { label: "Last day", value: show(developer.out_date) },
              ]}
            />
          )}
        </CardContent>
      </Card>
      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>Remove</CardTitle>
            <CardDescription>Soft-deletes this person. Prefer Terminated when they are leaving the company.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldForm action={deleteDeveloper.bind(null, developer.id)} submitLabel="Delete developer" variant="destructive" fields={[]} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
