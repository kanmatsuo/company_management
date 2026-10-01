"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { components } from "@/api/schema";
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

export function OccupancyBoard({ initial, socketBase }: { initial: Occupancy; socketBase: string }) {
  const [occupancy, setOccupancy] = useState(initial);
  const [scans, setScans] = useState<DoorScan[]>([]);
  const [live, setLive] = useState("Connecting");

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let wait = 1000;
    let timer = 0;

    async function connect() {
      const response = await fetch("/api/realtime/ticket", { method: "POST" });
      if (!response.ok) {
        setLive("Live updates need attendance.view");
        return;
      }
      const body = (await response.json()) as { ticket?: string };
      if (!body.ticket || stopped) return;
      const url = `${socketBase}/ws/occupancy/?ticket=${encodeURIComponent(body.ticket)}`;
      socket = new WebSocket(url);
      socket.onopen = () => {
        wait = 1000;
        setLive("Live");
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as { type?: string; data?: Occupancy | DoorScan };
        if (message.type === "occupancy" && message.data) setOccupancy(message.data as Occupancy);
        if (message.type === "attendance" && message.data) {
          const scan = message.data as DoorScan;
          setScans((current) => [scan, ...current].slice(0, 12));
        }
      };
      socket.onclose = () => {
        setLive("Reconnecting");
        if (!stopped) timer = window.setTimeout(connect, wait);
        wait = Math.min(wait * 2, 10000);
      };
    }

    void connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      socket?.close();
    };
  }, [socketBase]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{live} · {occupancy.total.toLocaleString()} inside</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {occupancy.buildings.map((building) => (
          <Link key={building.id} href={`/occupancy/people?building=${building.id}`}>
            <Card>
              <CardHeader>
                <CardTitle>{building.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-3xl tabular-nums">{building.count}</p>
                <p className="text-muted-foreground text-sm">{building.code}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        <Link href="/occupancy/people?building=none">
          <Card>
            <CardHeader>
              <CardTitle>No building</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-3xl tabular-nums">{occupancy.unknown_building}</p>
              <p className="text-muted-foreground text-sm">Last in had no door</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Door scans</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {scans.length === 0 ? <p className="text-muted-foreground text-sm">Waiting for the next door scan.</p> : null}
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
