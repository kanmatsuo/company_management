import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Profile = components["schemas"]["MyDeveloperProfile"];

export default async function MyDeveloperPage() {
  const loaded = await loadOne<Profile>("/api/v1/developers/me/");
  if (!loaded.value) return <LoadError title="My profile" message={loaded.error ?? "No developer profile is linked to this account."} />;
  const profile = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{profile.full_name}</h1>
        <p className="text-muted-foreground text-sm">Your own developer profile.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{profile.employee_number}</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Phone", value: show(profile.phone) },
              { label: "Home address", value: show(profile.home_address) },
              { label: "Birthday", value: show(profile.birthday) },
              { label: "Department", value: show(profile.department) },
              { label: "Title", value: show(profile.position_title) },
              { label: "Manager", value: show(profile.manager?.full_name) },
              { label: "Status", value: show(profile.status) },
              { label: "Started", value: show(profile.start_date) },
              { label: "Last day", value: show(profile.out_date) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
