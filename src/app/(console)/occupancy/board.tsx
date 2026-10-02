"use client";

import { useEffect, useState, useTransition } from "react";
import type { components } from "@/api/schema";
import { refreshOccupancy } from "@/app/(console)/occupancy/actions";
import { BuildingBars } from "@/components/building-bars";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Occupancy = components["schemas"]["Occupancy"];

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

function LocalTime({ value }: { value: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const date = new Date(value);
    setLabel(Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString());
  }, [value]);
  if (!label) return null;
  return ` · ${label}`;
}

export function OccupancyBoard({
  initial,
  socketBase,
  staff,
}: {
  initial: Occupancy;
  socketBase: string;
  staff: number;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {live === "Live"
            ? t(locale, "Live · counts update as doors scan")
            : `${t(locale, live)} · ${t(locale, "counts reload every 10 seconds")}`}
          {occupancy.as_of ? <LocalTime value={occupancy.as_of} /> : null}
          {refreshError ? ` · ${refreshError}` : ""}
        </p>
        <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={reload}>
          {refreshing ? t(locale, "Refreshing") : t(locale, "Refresh")}
        </Button>
      </div>
      <BuildingBars occupancy={occupancy} staff={staff} />
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Door scans")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {scans.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "Waiting for the next door scan.")}</p> : null}
          {scans.map((scan) => (
            <p key={scan.id} className={scan.accepted ? "text-sm" : "text-destructive text-sm"}>
              {scan.device_code}
              {scan.direction ? ` · ${scan.direction}` : ""}
              {" · "}
              {scan.display_message || scan.result}
              {scan.building?.name ? ` · ${scan.building.name}` : ""}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
