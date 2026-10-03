import type { components } from "@/api/schema";
import { SeriesChart } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/period-picker";
import { listPath, one } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";
import { loadList, loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { daySpan, resolvePeriod, startOfWeek, todayIso } from "@/lib/period";

type Day = components["schemas"]["DailyAttendance"];
type Record = components["schemas"]["AttendanceRecord"];
type Occupancy = components["schemas"]["Occupancy"];
type Device = { code: string; building?: number | null };






export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; building?: string }>;
}) {
  const query = await searchParams;
  const locale = await getLocale();
  const today = todayIso();
  const { start, end } = resolvePeriod(query, { start: today, end: today });
  const buildingId = one(query.building);

  const [days, scans, devices, occupancyLoaded] = await Promise.all([
    loadRecords<Day>("attendance.view", listPath("/api/v1/attendance/daily/?ordering=work_date", { date_from: start, date_to: end })),
    loadRecords<Record>("attendance.view", listPath("/api/v1/attendance/records/?ordering=event_time&is_void=false", { date_from: start, date_to: end })),
    loadList<Device>("/api/v1/rfid/devices/?purpose=ATTENDANCE"),
    loadOne<Occupancy>("/api/v1/attendance/occupancy/"),
  ]);
  if (days.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "No access")}</CardTitle>
          <CardDescription>{t(locale, "Your account cannot open attendance statistics.")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const buildingName = new Map<number, string>();
  for (const building of occupancyLoaded.value?.buildings ?? []) buildingName.set(building.id, building.name);
  const deviceBuilding = new Map<string, number>();
  for (const device of devices.results) {
    if (typeof device.building === "number") deviceBuilding.set(device.code, device.building);
  }

  const inBuilding = (record: Record) => {
    const id = deviceBuilding.get(record.device_code);
    if (!buildingId) return true;
    if (buildingId === "none") return id === undefined;
    return String(id ?? "") === buildingId;
  };
  const buildingScans = scans.results.filter((record) => !record.is_void && inBuilding(record));
  const buildingPeople = new Set(
    buildingScans.map((record) => record.developer?.id).filter((id): id is number => typeof id === "number"),
  );
  const rangedDays = buildingId
    ? days.results.filter((day) => typeof day.developer?.id === "number" && buildingPeople.has(day.developer.id))
    : days.results;

  const people = new Set(rangedDays.map((day) => day.developer?.id).filter((id): id is number => typeof id === "number"));
  const ins = buildingScans.filter((record) => record.event_type === "IN").length;
  const outs = buildingScans.filter((record) => record.event_type === "OUT").length;

  const byBuilding = new Map<string, { name: string; people: Set<number>; ins: number; outs: number }>();
  for (const building of occupancyLoaded.value?.buildings ?? []) {
    byBuilding.set(String(building.id), { name: building.name, people: new Set(), ins: 0, outs: 0 });
  }
  for (const record of scans.results) {
    if (record.is_void) continue;
    const id = deviceBuilding.get(record.device_code);
    const key = id === undefined ? "none" : String(id);
    const row = byBuilding.get(key) ?? { name: key === "none" ? "No building" : `Building ${key}`, people: new Set<number>(), ins: 0, outs: 0 };
    if (typeof record.developer?.id === "number") row.people.add(record.developer.id);
    if (record.event_type === "IN") row.ins += 1;
    if (record.event_type === "OUT") row.outs += 1;
    byBuilding.set(key, row);
  }

  const byDepartment = new Map<string, Set<number>>();
  for (const day of rangedDays) {
    const name = day.developer?.department || "No department";
    const row = byDepartment.get(name) ?? new Set<number>();
    if (typeof day.developer?.id === "number") row.add(day.developer.id);
    byDepartment.set(name, row);
  }

  const weekly = daySpan(start, end) > 31;
  const byPeriod = new Map<string, Set<number>>();
  for (const day of rangedDays) {
    const key = weekly ? startOfWeek(day.work_date) : day.work_date;
    const row = byPeriod.get(key) ?? new Set<number>();
    if (typeof day.developer?.id === "number") row.add(day.developer.id);
    byPeriod.set(key, row);
  }
  const periods = [...byPeriod.entries()].sort(([left], [right]) => left.localeCompare(right));
  const buildingRows = [...byBuilding.entries()].filter(([, row]) => row.people.size > 0 || row.ins > 0 || row.outs > 0);
  const departments = [...byDepartment.entries()].sort((left, right) => right[1].size - left[1].size);
  const selectedBuilding = buildingId === "none" ? "No building" : buildingName.get(Number(buildingId)) ?? "All buildings";
  const truncated = days.count > days.results.length || scans.count > scans.results.length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Statistics")}</h1>
        <p className="text-muted-foreground text-sm">
          {start} {t(locale, "to")} {end}.
          {buildingId ? ` · ${selectedBuilding}` : ""}
          {truncated ? " This range is larger than the page can load in full." : ""}
          {days.error || scans.error ? ` ${days.error || scans.error}` : ""}
        </p>
      </div>
      <PeriodPicker path="/attendance/statistics" period={{ start, end }} today={today} locale={locale} keep={{ building: buildingId }} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["People", people.size, t(locale, "Different people recorded in this date range")],
          ["In scans", ins, t(locale, "Door scans marked in")],
          ["Out scans", outs, t(locale, "Door scans marked out")],
        ].map(([label, value, hint]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardDescription>{t(locale, String(label))}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{Number(value).toLocaleString("en-US")}</CardTitle>
              <p className="text-muted-foreground text-sm">{hint}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "By building")}</CardTitle>
          <CardDescription>
            {t(locale, "Each bar is people who scanned at that building. A person who used two buildings is counted in both.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={buildingRows.map(([id, row]) => ({
              name: row.name,
              people: row.people.size,
              ins: row.ins,
              outs: row.outs,
              href: `/attendance/statistics?from=${start}&to=${end}&building=${id}`,
            }))}
            series={[
              { key: "people", label: t(locale, "People"), color: "var(--chart-1)" },
              { key: "ins", label: t(locale, "In"), color: "var(--chart-3)" },
              { key: "outs", label: t(locale, "Out"), color: "var(--chart-4)" },
            ]}
            height={Math.max(240, buildingRows.length * 56)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{weekly ? t(locale, "By week") : t(locale, "By day")}</CardTitle>
          <CardDescription>
            {weekly
              ? t(locale, "Each bar is only that week. A person who came on more than one week is counted once above and once on each bar.")
              : t(locale, "Each bar is only that day. A person who came on more than one day is counted once above and once on each bar.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={periods.map(([period, row]) => ({
              name: period.slice(5),
              people: row.size,
            }))}
            series={[{ key: "people", label: t(locale, "People"), color: "var(--chart-1)" }]}
            height={300}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "By department")}</CardTitle>
          <CardDescription>{t(locale, "Each bar is the people in that department. A person has one department, so these bars add up to People above.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart
            data={departments.map(([name, row]) => ({ name, people: row.size }))}
            series={[{ key: "people", label: t(locale, "People"), color: "var(--chart-3)" }]}
            layout="vertical"
            height={Math.max(220, departments.length * 48)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
