import type { components } from "@/api/schema";
import { LoadError } from "@/components/no-access";
import { getApiUrl } from "@/lib/env";
import { loadOne } from "@/lib/page-data";
import { OccupancyBoard } from "@/app/(console)/occupancy/board";

type Occupancy = components["schemas"]["Occupancy"];

export default async function OccupancyPage() {
  const loaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  if (!loaded.value) return <LoadError title="Who is inside" message={loaded.error ?? "Could not load occupancy."} />;
  const socketBase = getApiUrl().replace(/^http/, "ws");
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Who is inside</h1>
        <p className="text-muted-foreground text-sm">
          A person stays inside until their latest scan is an out, or a manual out is recorded. Counts update as doors scan.
        </p>
      </div>
      <OccupancyBoard initial={loaded.value} socketBase={socketBase} />
    </div>
  );
}
