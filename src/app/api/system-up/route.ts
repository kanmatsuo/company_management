import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/env";

/** Is the backend answering? Polled by the "Restoring" page (no sign-in needed). */
export async function GET() {
  try {
    const response = await fetch(`${getApiUrl()}/health/db/`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    return NextResponse.json({ up: response.ok }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ up: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
