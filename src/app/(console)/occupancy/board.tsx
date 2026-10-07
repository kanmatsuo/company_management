"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import type { components } from "@/api/schema";
import { refreshOccupancy } from "@/app/(console)/occupancy/actions";
import { Building2, LogIn, LogOut, RefreshCw, X } from "lucide-react";
import Link from "@/components/app-link";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Occupancy = components["schemas"]["Occupancy"];

type FeedItem = { id: string; name: string; direction: string; device: string; message: string; accepted: boolean; time: string };

type DoorScan = {
  id: number;
  result: string;
  accepted: boolean;
  direction: string;
  display_message: string;
  developer: { full_name?: string } | null;
  device_code: string;
  building: { code?: string; name?: string } | null;
  event_time: string;
};

const noop = () => () => {};
/** Times are shown in the browser's time zone, so render them only in the browser. */
const useInBrowser = () => useSyncExternalStore(noop, () => true, () => false);

function LocalTime({ value }: { value: string }) {
  const inBrowser = useInBrowser();
  const date = new Date(value);
  if (!inBrowser || Number.isNaN(date.getTime())) return null;
  return ` · ${date.toLocaleTimeString()}`;
}

export function OccupancyBoard({
  initial,
  socketBase,
  staff,
  recent,
  title,
  description,
}: {
  initial: Occupancy;
  socketBase: string;
  staff: number;
  recent: FeedItem[];
  title: string;
  description: string;
}) {
  const [occupancy, setOccupancy] = useState(initial);
  const [scans, setScans] = useState<DoorScan[]>([]);
  const [live, setLive] = useState("Connecting");
  const [refreshError, setRefreshError] = useState("");
  const [refreshing, startRefresh] = useTransition();
  const locale = useLocale();

  function applyOccupancy(next: Occupancy | null, error: string | null) {
    if (next) {
      setOccupancy(next);
      setRefreshError("");
      return;
    }
    if (error) setRefreshError(error);
  }

  function reload() {
    startRefresh(async () => {
      const result = await refreshOccupancy();
      applyOccupancy(result.value, result.error);
    });
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshOccupancy().then((result) => applyOccupancy(result.value, result.error));
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let wait = 1000;
    let timer = 0;
    let liveTimer = 0;
    let attempt = 0;

    async function connect() {
      const mine = ++attempt;
      const response = await fetch("/api/realtime/ticket", { method: "POST" });
      if (stopped || mine !== attempt) return;
      if (!response.ok) {
        setLive("Live updates need attendance.view");
        return;
      }
      const body = (await response.json()) as { ticket?: string };
      if (!body.ticket || stopped || mine !== attempt) return;
      const next = new WebSocket(`${socketBase}/ws/occupancy/?ticket=${encodeURIComponent(body.ticket)}`);
      socket = next;
      next.onopen = () => {
        if (stopped || socket !== next) return;
        wait = 1000;
        window.clearTimeout(liveTimer);
        liveTimer = window.setTimeout(() => {
          if (socket === next && next.readyState === WebSocket.OPEN) setLive("Live");
        }, 6000);
      };
      next.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as { type?: string; data?: Occupancy | DoorScan };
        if (message.type === "occupancy" && message.data) setOccupancy(message.data as Occupancy);
        if (message.type === "attendance" && message.data) {
          const scan = message.data as DoorScan;
          setScans((current) => [scan, ...current].slice(0, 12));
        }
      };
      next.onclose = () => {
        if (socket !== next) return;
        window.clearTimeout(liveTimer);
        setLive("Reconnecting");
        if (!stopped) timer = window.setTimeout(connect, wait);
        wait = Math.min(wait * 2, 10000);
      };
    }

    void connect();
    return () => {
      stopped = true;
      attempt += 1;
      window.clearTimeout(timer);
      window.clearTimeout(liveTimer);
      socket?.close();
    };
  }, [socketBase]);

  const feed: FeedItem[] = [
    ...scans.map((scan) => ({
      id: `s${scan.id}`,
      name: scan.developer?.full_name ?? "",
      direction: scan.direction,
      device: `${scan.device_code}${scan.building?.name ? ` · ${scan.building.name}` : ""}`,
      message: scan.display_message || scan.result,
      accepted: scan.accepted,
      time: scan.event_time,
    })),
    ...recent,
  ].slice(0, 12);
  const away = Math.max(staff - occupancy.total, 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
            <span className={`size-2 rounded-full ${live === "Live" ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`} />
            {live === "Live" ? t(locale, "Live") : t(locale, live)}
            {occupancy.as_of ? <span className="text-muted-foreground"><LocalTime value={occupancy.as_of} /></span> : null}
          </span>
          <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={reload}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            {t(locale, "Refresh")}
          </Button>
        </div>
      </div>
      {refreshError ? <p className="text-destructive text-sm">{refreshError}</p> : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid gap-4">
          <Card className="brand-glow">
            <CardContent className="grid gap-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Link href="/attendance/buildings/all" className="text-muted-foreground text-sm hover:underline">
                    {t(locale, "All staff")}
                  </Link>
                  <p className="font-semibold text-5xl tabular-nums tracking-tight">
                    {occupancy.total.toLocaleString("en-US")}
                    <span className="ml-2 font-normal text-lg text-muted-foreground">
                      {t(locale, "of")} {staff.toLocaleString("en-US")} {t(locale, "inside")}
                    </span>
                  </p>
                </div>
                <p className="font-semibold text-3xl text-primary tabular-nums">{percent(occupancy.total, staff)}%</p>
              </div>
              <Bar value={occupancy.total} total={staff} large />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Figure label={t(locale, "Inside")} value={occupancy.total} />
                <Figure label={t(locale, "Not in")} value={away} />
                <Figure label={t(locale, "Buildings")} value={occupancy.buildings.length} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {occupancy.buildings.map((building) => {
              const roster = building.developers || building.count;
              return (
                <Link key={building.id} href={`/attendance/buildings/${building.id}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardContent className="grid gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="size-4" />
                          </span>
                          <div>
                            <p className="font-medium">{building.name}</p>
                            <p className="text-muted-foreground text-xs">{building.code}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary text-sm tabular-nums">{percent(building.count, roster)}%</span>
                      </div>
                      <p className="font-semibold text-2xl tabular-nums">
                        {building.count.toLocaleString("en-US")}
                        <span className="ml-1 font-normal text-muted-foreground text-sm">
                          {t(locale, "of")} {roster.toLocaleString("en-US")}
                        </span>
                      </p>
                      <Bar value={building.count} total={roster} />
                      <p className="text-muted-foreground text-xs">
                        {Math.max(roster - building.count, 0).toLocaleString("en-US")} {t(locale, "not in")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            {occupancy.unknown_building > 0 ? (
              <Link href="/attendance/buildings/none" className="group">
                <Card className="h-full border-dashed transition-colors group-hover:border-primary/50">
                  <CardContent className="grid gap-2">
                    <p className="font-medium">{t(locale, "No building")}</p>
                    <p className="text-muted-foreground text-xs">{t(locale, "Inside, but the last scan had no door")}</p>
                    <p className="font-semibold text-2xl tabular-nums">{occupancy.unknown_building.toLocaleString("en-US")}</p>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Door scans")}</CardTitle>
            <CardDescription>{t(locale, "The latest scans. New ones appear here as they happen.")}</CardDescription>
          </CardHeader>
          <CardContent>
            {feed.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "Waiting for the next door scan.")}</p> : null}
            <ul className="grid divide-y">
              {feed.map((item) => {
                const out = item.direction === "OUT";
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        !item.accepted ? "bg-destructive/10 text-destructive" : out ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {!item.accepted ? <X className="size-4" /> : out ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{item.name || item.message || "—"}</p>
                      <p className={`truncate text-xs ${item.accepted ? "text-muted-foreground" : "text-destructive"}`}>
                        {item.accepted ? `${t(locale, out ? "Out" : "In")} · ${item.device}` : `${item.message} · ${item.device}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                      <ScanTime value={item.time} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function percent(value: number, total: number) {
  const whole = Math.max(total, value, 0);
  return whole === 0 ? 0 : Math.round((value / whole) * 100);
}

function Bar({ value, total, large = false }: { value: number; total: number; large?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-full bg-muted ${large ? "h-3" : "h-2"}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={Math.max(total, value)}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400" style={{ width: `${percent(value, total)}%` }} />
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-lg tabular-nums">{value.toLocaleString("en-US")}</p>
    </div>
  );
}

/** Time of day for today's scans, date and time for older ones (browser time zone). */
function ScanTime({ value }: { value: string }) {
  const inBrowser = useInBrowser();
  const date = new Date(value);
  if (!inBrowser || Number.isNaN(date.getTime())) return null;
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}
