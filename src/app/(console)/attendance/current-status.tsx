import type { components } from "@/api/schema";
import { OccupancyBoard } from "@/app/(console)/occupancy/board";
import { LoadError } from "@/components/no-access";
import { getSocketBase } from "@/lib/socket-url";
import { loadCount, loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

type Occupancy = components["schemas"]["Occupancy"];

export async function CurrentStatus() {
  const locale = await getLocale();
  const loaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  if (!loaded.value) return <LoadError title={t(locale, "Current status")} message={loaded.error ?? t(locale, "Could not load occupancy.")} />;
  const staff = await loadCount("/api/v1/developers/?status=ACTIVE");
  const socketBase = await getSocketBase();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Current status")}</h1>
        <p className="text-muted-foreground text-sm">
          {t(locale, "The fill is who is present right now. The number after “of” is that building’s developers. All staff uses every active developer.")}
          {staff.error ? ` ${staff.error}` : ""}
        </p>
      </div>
      <OccupancyBoard initial={loaded.value} socketBase={socketBase} staff={staff.count} />
    </div>
  );
}
