import { Title, Hint } from "@/components/auto-text";
import { NoAccess } from "@/components/no-access";
import type { Reader } from "@/app/(console)/cards/card-reader";
import { NewDeveloperForm } from "@/app/(console)/developers/new/new-developer-form";
import { can, canManage } from "@/lib/current-user";
import { djangoFetch } from "@/lib/django";
import { requireSession } from "@/lib/page-data";
import { buildingChoices, departmentNames } from "@/lib/choices";

export default async function NewDeveloperPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["developer"])) {
    return <NoAccess description="Your account cannot create developers." />;
  }
  const assignCards = can(session.user, "rfid.assign");
  const [buildings, departments, readers] = await Promise.all([
    buildingChoices(session.token),
    departmentNames(session.token),
    assignCards
      ? djangoFetch<{ devices: Reader[] }>("/api/v1/rfid/card-reads/", { accessToken: session.token })
          .then((body) => body.devices)
          .catch(() => [] as Reader[])
      : Promise.resolve(null),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New developer</Title>
        <Hint>Leaving the company is a status change, not a hard delete.</Hint>
      </div>
      <NewDeveloperForm buildings={buildings} departments={departments} readers={readers} />
    </div>
  );
}
