import { AutoText } from "@/components/auto-text";
import type { components } from "@/api/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { loadList, loadOne } from "@/lib/page-data";

type Occupancy = components["schemas"]["Occupancy"];
type Person = components["schemas"]["PersonInside"];
type Developer = components["schemas"]["Developer"];

function place(building: Person["building"]) {
  if (!building) return "No building";
  if (typeof building.name === "string" && building.name) return building.name;
  if (typeof building.code === "string" && building.code) return building.code;
  return "No building";
}

export default async function BuildingPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const occupancyLoaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  const occupancy = occupancyLoaded.value;
  const building = occupancy?.buildings.find((item) => String(item.id) === id);
  const known = id === "all" || id === "none" || Boolean(building);
  const title = id === "all" ? "All staff" : id === "none" ? "No building" : (building?.name ?? "Building");
  const insidePath =
    id === "all" ? "/api/v1/attendance/occupancy/people/" : `/api/v1/attendance/occupancy/people/?building=${id}`;
  const insideLoaded = known
    ? await loadList<Person>(insidePath)
    : { error: "This building is not on the list.", results: [] as Person[] };
  const staffLoaded =
    known && id === "all"
      ? await loadList<Developer>("/api/v1/developers/?status=ACTIVE&ordering=full_name")
      : { error: null, results: [] as Developer[] };

  const insideIds = new Set(
    insideLoaded.results.map((person) => person.developer?.id).filter((personId): personId is number => typeof personId === "number"),
  );
  const inside = [...insideLoaded.results].sort((left, right) =>
    (left.developer?.full_name ?? "").localeCompare(right.developer?.full_name ?? ""),
  );
  const outside = staffLoaded.results
    .filter((developer) => developer.status === "ACTIVE" && !insideIds.has(developer.id))
    .sort((left, right) => left.full_name.localeCompare(right.full_name));
  const error = occupancyLoaded.error || insideLoaded.error || staffLoaded.error;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">
          {error
            ? "The list could not be loaded."
            : id === "all"
              ? `${inside.length.toLocaleString("en-US")} in · ${outside.length.toLocaleString("en-US")} out`
              : `${inside.length.toLocaleString("en-US")} in this building`}
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>In</CardTitle>
          <CardDescription>
            {id === "all" ? "Present in any building." : "Present in this building."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inside.length === 0 ? (
            <p className="text-muted-foreground text-sm"><AutoText>Nobody is in.</AutoText></p>
          ) : (
            <DataTable
              headers={id === "all" ? ["Person", "Department", "Building"] : ["Person", "Department"]}
              rows={inside.map((person) =>
                id === "all"
                  ? [person.developer?.full_name || "—", person.developer?.department || "—", place(person.building)]
                  : [person.developer?.full_name || "—", person.developer?.department || "—"],
              )}
            />
          )}
        </CardContent>
      </Card>
      {id === "all" ? (
      <Card>
        <CardHeader>
          <CardTitle>Out</CardTitle>
          <CardDescription>Active staff who are not inside any building.</CardDescription>
        </CardHeader>
        <CardContent>
          {outside.length === 0 ? (
            <p className="text-muted-foreground text-sm"><AutoText>Nobody is out.</AutoText></p>
          ) : (
            <DataTable
              headers={["Person", "Department"]}
              rows={outside.map((developer) => [developer.full_name, developer.department || "—"])}
            />
          )}
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}
