import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Person = components["schemas"]["PersonInside"];

function place(building: Person["building"]) {
  if (!building) return "No building";
  if (typeof building.name === "string" && building.name) return building.name;
  if (typeof building.code === "string" && building.code) return building.code;
  return "—";
}

export default async function OccupancyPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string; department?: string; search?: string }>;
}) {
  const query = await searchParams;
  const data = await loadList<Person>(
    listPath("/api/v1/attendance/occupancy/people/", {
      building: one(query.building),
      department: one(query.department),
      search: one(query.search),
    }),
  );
  return (
    <RecordList
      title="Inside now"
      summary={`${data.count.toLocaleString()} people`}
      description="Latest record is an in, and no later out has been recorded."
      error={data.error}
      empty="Nobody is inside this selection."
      headers={["Person", "Department", "Building", "Since", "Door"]}
      rows={data.results.map((person) => [
        show(person.developer?.full_name),
        show(person.developer?.department),
        place(person.building),
        showTime(person.since),
        show(person.device_code),
      ])}
    />
  );
}
