import type { components } from "@/api/schema";
import { OccupancyBoard } from "@/app/(console)/occupancy/board";
import { LoadError } from "@/components/no-access";
import { getApiUrl } from "@/lib/env";
import { loadCount, loadOne } from "@/lib/page-data";

type Occupancy = components["schemas"]["Occupancy"];

export async function CurrentStatus() {
  const loaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  if (!loaded.value) return <LoadError title="Current status" message={loaded.error ?? "Could not load occupancy."} />;
  const staff = await loadCount("/api/v1/developers/?status=ACTIVE");
  const socketBase = getApiUrl().replace(/^http/, "ws");
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Current status</h1>
        <p className="text-muted-foreground text-sm">
          The fill is who is present right now. The number after “of” is that building’s developers. All staff uses every active developer.
          {staff.error ? ` ${staff.error}` : ""}
        </p>
      </div>
      <OccupancyBoard initial={loaded.value} socketBase={socketBase} staff={staff.count} />
    </div>
  );
}
