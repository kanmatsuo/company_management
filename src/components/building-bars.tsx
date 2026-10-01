import Link from "next/link";
import type { components } from "@/api/schema";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Occupancy = components["schemas"]["Occupancy"];

export function BuildingBars({ occupancy, staff }: { occupancy: Occupancy; staff: number }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Link href="/attendance/buildings/all" className="hover:underline">
              All staff
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={occupancy.total}
            total={staff}
            caption={`${Math.max(staff - occupancy.total, 0).toLocaleString("en-US")} left`}
          />
        </CardContent>
      </Card>
      {occupancy.buildings.map((building) => {
        const roster = building.developers || building.count;
        return (
          <Card key={building.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/attendance/buildings/${building.id}`} className="hover:underline">
                  {building.name}
                </Link>
              </CardTitle>
              <p className="text-muted-foreground text-sm">{building.code}</p>
            </CardHeader>
            <CardContent>
              <ProgressBar
                value={building.count}
                total={roster}
                caption={`${Math.max(roster - building.count, 0).toLocaleString("en-US")} left`}
              />
            </CardContent>
          </Card>
        );
      })}
      {occupancy.unknown_building > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Link href="/attendance/buildings/none" className="hover:underline">
                No building
              </Link>
            </CardTitle>
            <p className="text-muted-foreground text-sm">Inside, but the last scan had no door</p>
          </CardHeader>
          <CardContent>
            <ProgressBar value={occupancy.unknown_building} total={occupancy.unknown_building} caption="Still inside" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
