"use server";

import type { components } from "@/api/schema";
import { loadOne } from "@/lib/page-data";

type Occupancy = components["schemas"]["Occupancy"];

export async function refreshOccupancy() {
  const loaded = await loadOne<Occupancy>("/api/v1/attendance/occupancy/");
  if (!loaded.value) return { error: loaded.error ?? "Could not refresh.", value: null };
  return { error: null, value: loaded.value };
}
