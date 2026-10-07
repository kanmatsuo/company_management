import type { components } from "@/api/schema";
import { OccupancyBoard } from "@/app/(console)/occupancy/board";
import { LoadError } from "@/components/no-access";
import { getSocketBase } from "@/lib/socket-url";
import { djangoFetch } from "@/lib/django";
import { loadCount, loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

type Occupancy = components["schemas"]["Occupancy"];
type AttendanceRecord = components["schemas"]["AttendanceRecord"];

export async function CurrentStatus() {
  const locale = await getLocale();
  const loaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  if (!loaded.value) return <LoadError title={t(locale, "Current status")} message={loaded.error ?? t(locale, "Could not load occupancy.")} />;
  const [staff, recent, socketBase] = await Promise.all([
    loadCount("/api/v1/developers/?status=ACTIVE"),
    latestScans(loaded.session.token),
    getSocketBase(),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <OccupancyBoard
        initial={loaded.value}
        socketBase={socketBase}
        staff={staff.count}
        recent={recent}
        title={t(locale, "Current status")}
        description={`${t(locale, "Who is inside right now, by building.")}${staff.error ? ` ${staff.error}` : ""}`}
      />
    </div>
  );
}

/** The latest door scans, so the feed is not empty before the next one arrives. */
async function latestScans(token: string) {
  const page = await djangoFetch<{ results: AttendanceRecord[] }>("/api/v1/attendance/records/?ordering=-event_time&is_void=false&page_size=12", {
    accessToken: token,
  }).catch(() => ({ results: [] as AttendanceRecord[] }));
  return page.results.map((record) => ({
    id: `r${record.id}`,
    name: record.developer?.full_name ?? "",
    direction: record.event_type,
    device: record.device_code ?? "",
    message: "",
    accepted: true,
    time: record.event_time,
  }));
}
